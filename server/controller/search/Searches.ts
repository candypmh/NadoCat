import { Prisma } from "@prisma/client";
import { getCategoryUrlStringById } from "../../constants/category";
import { SEARCH } from "../../constants/search";
import { TCategoryId } from "../../types/category";
import opensearch from "./../../opensearch";
import { Request, Response } from "express";
import prisma from "../../client";
import { getCommunityById } from "../../model/community.model";
import { getEventById } from "../../model/event.model";
import { getMissingById, getPostByPostId } from "../../model/missing.model";
import { getStreetCat } from "../streetCat/StreetCats";
import { getStreetCatById, readPost } from "../../model/streetCat.model";

const getId = (categoryId: TCategoryId, postId: number) => `${categoryId}_${postId}`;

const getDataForSearch = (categoryId: TCategoryId, postId: number) => {
  return {
    categoryName: getCategoryUrlStringById(categoryId),
    documentId: getId(categoryId, postId)
  }
}

export const searchDocuments = async (req: Request, res: Response) => {
  console.log("searchDocuments function called");
  const { query } = req.query;
  try {
    const searchCategoryList = [1, 2, 3, 5].map((id) => getCategoryUrlStringById(id as TCategoryId))

    const results = await Promise.all(
      searchCategoryList.map(async (categoryName) => {
        // console.log(categoryName)
        try {
          const result = await opensearch.search({

            index: categoryName,
            body: {
              track_total_hits: true,
              query: {
                bool: {
                  should: [
                    { match: { content: query } },
                    { match: { title: query } },
                    { match: { detail: query } },
                    { match: { name: query } }
                    // { match: { nickname: query } }
                  ]
                }
              }
            },
            size: SEARCH.SIZE
          });
          return {
            category: categoryName,
            search: result.body.hits.hits,
            totalcount: result.body.hits.total
          };
        } catch {
          console.log(`No ${categoryName}`)
          return;
        }
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('OpenSearch search error:', error);
    res.status(500).send('Error searching documents');
  }
};

// export const indexOpensearchDocument = async (categoryId: TCategoryId, nickname: string, title: string, content: string, postId: number, timestamp: string, profile?: string, image?: string, tag?: string[]) => {
//   try {
//     const { categoryName, documentId } = getDataForSearch(categoryId, postId);

//     const response = await opensearch.index({
//       index: categoryName,
//       id: documentId,
//       body: {
//         nickname,
//         profile,
//         title,
//         content,
//         url: `/boards/${categoryName}/${postId}`,
//         image,
//         tag,
//         timestamp
//       }
//     });
//     console.log('Document indexed:', response);
//   } catch (error) {
//     console.error('Error indexing document:', error);
//   }
// };

export const indexOpensearchDocument = async (categoryId: TCategoryId, postId: number, post: any) => {
  try {
    const { categoryName, documentId } = getDataForSearch(categoryId, postId);

    const response = await opensearch.index({
      index: categoryName,
      id: documentId,

      body: post
    });
    console.log('Document indexed:', response);
  } catch (error) {
    console.error('Error indexing document:', error);
  }
};

export const indexOpensearchUser = async (email: string, nickname: string, uuid: string) => {
  try {
    const response = await opensearch.index({
      index: "users",
      id: uuid,
      body: {
        nickname,
        url: `/users/${uuid}/profile`
      }
    });
    console.log('User indexed:', response);
  } catch (error) {
    console.error('Error indexing user:', error);
  }
}

export const updateOpensearchUser = async (nickname: string, uuid: string) => {
  try {
    const response = await opensearch.update({
      index: "users",
      id: uuid,
      body: {
        doc: {
          nickname
        }
      }
    });
    console.log('User indexed:', response);
  } catch (error) {
    console.error('Error indexing user:', error);
  }
}

export const updateOpensearchDocument = async (categoryId: TCategoryId, postId: number, data: any) => {
  try {
    const { categoryName, documentId } = getDataForSearch(categoryId, postId);

    const response = await opensearch.update({
      index: categoryName,
      id: documentId,
      body: {
        doc: data
      }
    });
    console.log('Document updated:', response);
  } catch (error) {
    console.error('Error updating document:', error);
  }
};

export const deleteOpensearchDocument = async (categoryId: TCategoryId, postId: number) => {
  try {
    const { categoryName, documentId } = getDataForSearch(categoryId, postId);

    const response = await opensearch.delete({
      index: categoryName,
      id: documentId
    });
    console.log('Document deleted:', response);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};

export const indexResultToOpensearch = async (categoryId: TCategoryId, postId: number) => {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let postDataForOpensearch;

    switch (categoryId) {
      case 1:
        postDataForOpensearch = await getCommunityById(tx, postId);
        break;
      case 2:
        postDataForOpensearch = await getEventById(tx, postId);
        break;
      case 3:
        postDataForOpensearch = await getMissingById(tx, postId);
        break;
      case 5:
        postDataForOpensearch = await getStreetCatById(tx, postId);
        console.log(postDataForOpensearch);
        break;
      default:
        throw new Error("유효하지 않은 카테고리 ID");
    }

    if (!postDataForOpensearch) throw new Error("포스트 없다");
    await indexOpensearchDocument(categoryId, postId, postDataForOpensearch);
  });
};
