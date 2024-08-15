import { Request, Response, NextFunction } from "express";
import prisma from "../../client";
import { getUuid } from "./StreetCats";
import { addComment, putComment, readComments, readPost, removeComment } from "../../model/streetCat.model";
import { notifyNewComment } from "../notification/Notifications";
import { CATEGORY } from "../../constants/category";

// NOTE: 임시 데이터 streetCatCommentId 값 주의

// 동네 고양이 도감 댓글 목록 조회
export const getStreetCatComments = async (req: Request, res: Response) => {
  const uuid = await getUuid();
  const postId = Number(req.params.street_cat_id);
  const limit = Number(req.query.limit);
  const cursor = Number(req.query.cursor);

  try {
    await prisma.$transaction(async (tx) => {
      const getComments = await (isNaN(cursor)
        ? readComments(tx, postId, limit)
        : readComments(tx, postId, limit, cursor)
      );

      res.status(200).json(getComments);
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// 동네 고양이 도감 댓글 등록
export const createStreetCatComment = async (req: Request, res: Response) => {
  const uuid = await getUuid();
  const postId = Number(req.params.street_cat_id);
  const { comment } = req.body;

  try {
    const createComment = await addComment(uuid, postId, comment);

    if (createComment.streetCatCommentId)
      await notifyNewComment(uuid, CATEGORY.STREET_CATS, postId, createComment.streetCatCommentId)

    res.status(200).json({ message: "댓글 등록" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// 동네 고양이 도감 댓글 수정
export const updateStreetCatComment = async (req: Request, res: Response) => {
  const uuid = await getUuid();
  const streetCatId = Number(req.params.street_cat_id);
  const streetCatCommentId = 2; // 임시 데이터
  const { comment } = req.body;

  try {
    await putComment(uuid, streetCatCommentId, streetCatId, comment);

    res.status(200).json({ message: "댓글 수정" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// 동네 고양이 도감 댓글 삭제
export const deleteStreetCatComment = async (req: Request, res: Response) => {
  const uuid = await getUuid();
  const streetCatId = Number(req.params.street_cat_id);
  const streetCatCommentId = 1; // 임시 데이터

  try {
    await removeComment(uuid, streetCatCommentId, streetCatId);

    res.status(200).json({ message: "내 도감 삭제" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}