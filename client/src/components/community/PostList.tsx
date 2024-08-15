import React from "react";
import Post from "./Post";
import "../../styles/css/components/community/postList.css";
import { ICommunity, ICommunityPage } from "../../models/community.model";
import { InfiniteData } from "@tanstack/react-query";

interface IProps {
  posts: InfiniteData<ICommunityPage> | undefined;
}

const PostList = ({ posts }: IProps) => {
  return (
    <ul className="list">
      {posts?.pages.map((group: ICommunityPage, i: number) => (
        <React.Fragment key={i}>
          {group.posts.map((post: ICommunity) => (
            <Post key={post.postId} post={post} />
          ))}
        </React.Fragment>
      ))}
    </ul>
  );
};

export default PostList;
