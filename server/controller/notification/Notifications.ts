import { Request, Response } from "express";
import {
  createNotification,
  getLatestNotificationByReceiver,
  getNotificationListByReceiver,
  getNotificationsCount,
  updateNotificationsIsReadByReceiver,
} from "../../model/notification.model";
import { StatusCodes } from "http-status-codes";
import { handleControllerError } from "../../util/errors/errors";
import { TCategoryId } from "../../types/category";
import { getFriendList } from "../../model/friend.model";
import { getCategoryUrlStringById } from "../../constants/category";
import { getPostAuthorUuid } from "../../model/common/uuid.model";
import { IListData } from "../../types/post";
import prisma from "../../client";
import { getPostsCount } from "../../model/missing.model";
import dotenv from "dotenv";

/* CHECKLIST
 * [x] 알람글 isRead update API
 * [x] 실종고양이 제보글 => 게시글 게시자
 * [x] 실종고양이 제보글 일치 여부 => 제보글 게시자
 * [x] 실종고양이 제보글 수정 => 게시글 게시자
 * [x] 실종고양이 수색 종료 => 모든 제보글 게시자 및 모든 즐겨찾기한 사용자
 * [x] 신규 글 작성 => 친구
 * [-] 좋아요 찍힘 => 게시글 게시자
 * [x] 댓글 => 게시글 게시자
 * [x] 친구 요청 => 요청 받은 사용자
 */

interface INoticiationData {
  type: TNotify;
  receiver: string;
  sender: string;
  url: string;
  commentId?: number;
  result?: string;
}

export interface INotification extends INoticiationData {
  timestamp: string;
}

export const notifications: INotification[] = [];
let lastNotification: INoticiationData | null = null;

export const serveNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // const sendNotifications = async () => {
    //   if (notifications.length) {
    //     await createNotification(notifications);
    //     notifications.forEach((notification) => {
    //       if (notification && userId && userId === notification.receiver) {
    //         const notificationData = JSON.stringify({
    //           type: notification.type,
    //           sender: notification.sender,
    //           url: notification.url,
    //           timestamp: notification.timestamp
    //         })
    //         res.write(`data: ${notificationData}\n\n`);
    //       }
    //     });
    //     notifications.length = 0;
    //   } else {
    //     res.write('\n\n');
    //   }
    // };

    const sendNotifications = async () => {
      if (notifications.length) {
        await createNotification(notifications);
        notifications.forEach((notification) => {
          if (notification && userId && userId === notification.receiver) {
            const notificationData = JSON.stringify({
              type: notification.type,
              sender: notification.sender,
              url: notification.url,
              timestamp: notification.timestamp,
            });
            res.write(`data: ${notificationData}\n\n`);
          }
        });
        notifications.length = 0;
      } else {
        res.write("\n\n");
      }
    };

    const intervalid = setInterval(sendNotifications, 2000);

    req.on("close", () => clearInterval(intervalid));
  } catch (error) {
    console.error(error);
    handleControllerError(error, res);
  } finally {
    await prisma.$disconnect();
  }
};

type TNotify = "newPost" | "comment" | "update" | "match" | "follow" | "found" | "like";

const timestampObject = () => {
  const timestamp = new Date();

  return {
    timestamp: timestamp.toISOString(),
  };
};

export const notify = (data: INoticiationData) => {
  // 동일한 알림이 아닌지 확인하는 로직
  if (
    lastNotification &&
    lastNotification.type === data.type &&
    lastNotification.receiver === data.receiver &&
    lastNotification.sender === data.sender &&
    lastNotification.url === data.url &&
    lastNotification.commentId === data.commentId &&
    lastNotification.result === data.result
  ) {
    return;
  }
  const timestamp = timestampObject();
  notifications.push({ ...data, ...timestamp });
  lastNotification = data;
};

export const updateNotifications = async (req: Request, res: Response) => {
  const uuid = req.user?.uuid;
  try {
    if (!uuid) {
      throw new Error("User UUID is missing.");
    }
    const userId = Buffer.from(uuid, "hex");
    updateNotificationsIsReadByReceiver(userId);

    return res.status(StatusCodes.OK);
  } catch (error) {
    handleControllerError(error, res);
  } finally {
    await prisma.$disconnect();
  }
};

export const notifyNewPostToFriends = async (userId: Buffer, categoryId: TCategoryId, postId: number) => {
  const friends = await getFriendList(userId);

  friends.forEach((friend) =>
    notify({
      type: "newPost",
      receiver: friend.followingId.toString("hex"),
      sender: userId.toString("hex"),
      url: `/boards/${getCategoryUrlStringById(categoryId)}/${postId}`,
    })
  );
};

export const notifyNewComment = async (userId: Buffer, categoryId: TCategoryId, postId: number, cursor: number) => {
  const postAuthor = await getPostAuthorUuid(categoryId, postId);
  notify({
    type: "comment",
    receiver: postAuthor.toString("hex"),
    sender: userId.toString("hex"),
    url: `/boards/${getCategoryUrlStringById(categoryId)}/${postId}/comments?cursor=${cursor}`, //프론트 url에 맞출 것
  });
};

export const notifyNewLike = async (userId: Buffer, categoryId: TCategoryId, postId: number) => {
  const postAuthor = await getPostAuthorUuid(categoryId, postId);
  notify({
    type: "like",
    receiver: postAuthor.toString("hex"),
    sender: userId.toString("hex"),
    url: `/boards/${getCategoryUrlStringById(categoryId)}/${postId}`, //프론트 url에 맞출 것
  });
};

export const getNotificationList = async (req: Request, res: Response) => {
  const uuid = req.user?.uuid;
  try {
    if (!uuid) {
      throw new Error("User UUID is missing.");
    }
    const userId = Buffer.from(uuid, "hex");
    const limit = 10;
    let notifications = await getNotificationListByReceiver(userId, limit);
    const count = await getNotificationsCount();

    const nextCursor = notifications.length === limit ? notifications[notifications.length - 1].notificationId : null;

    const result = {
      notifications,
      pagination: {
        nextCursor,
        totalCount: count,
      },
    };

    res.status(StatusCodes.OK).send(result);

    await updateNotificationsIsReadByReceiver(userId);
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const getIsAllNotificationRead = async (req: Request, res: Response) => {
  const uuid = req.user?.uuid;
  try {
    if (!uuid) {
      throw new Error("User UUID is missing.");
    }
    const userId = Buffer.from(uuid, "hex");
    const latest = await getLatestNotificationByReceiver(userId);
    const isAllRead = latest?.isRead;

    res.status(StatusCodes.OK).json({ isAllRead });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
