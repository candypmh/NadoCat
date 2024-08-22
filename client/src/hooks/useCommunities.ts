import { createCommunityPost, getCommunityPosts, Sort } from "../api/community.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const useCommunities = (sort?: Sort) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["community", sort],
    queryFn: ({ pageParam = 0 }) => getCommunityPosts({ pageParam, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage.pagination.nextCursor;
      if (nextCursor) {
        return nextCursor;
      }
      return undefined;
    },
  });

  const posts = data ? data.pages.flatMap((page) => page.posts) : [];
  const isEmpty = posts.length === 0;

  const { mutateAsync: addCommunityPost } = useMutation({
    mutationFn: (formData: FormData) => createCommunityPost(formData),
    onSuccess: (post) => {
      const postId = post.postId;
      queryClient.invalidateQueries({ queryKey: ["communityDetail", postId] });
    },
    onError: (error) => {
      console.error("Error creating community post:", error);
    },
  });

  return {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isEmpty,
    addCommunityPost,
  };
};

export default useCommunities;
