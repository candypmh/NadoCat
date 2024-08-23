import { useParams } from "react-router-dom";
import HeaderWithBackButton from "../../components/common/HeaderWithBackButton";
import MissingPostDetail from "../../components/missing/MissingPostDetail";
import useMissing from "../../hooks/useMissing";
import "../../styles/scss/pages/missing/missingDetail.scss";
import {
  IMissing,
  IMissingReport,
  IMissingReportPosts,
} from "../../models/missing.model";
import LoadingCat from "../../components/loading/LoadingCat";
import MissingReportPost from "../../components/missing/MissingReportPost";
import useMissingReports from "../../hooks/useMissingReports";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import MissingReportPostList from "../../components/missing/MissingReportPostList";

const MissingDetail = () => {
  const params = useParams();
  const postId = Number(params.id);
  const {
    data: post,
    error,
    isLoading,
    removeMissingPost,
  } = useMissing(postId);
  // const { commentCount, addCommunityComment } = useCommunityComment(postId);
  // const { dislikePost, likePost } = useLike(postId, "communityDetail");
  // const [isShowMenu, setIsShowMenu] = useState(false);
  const {
    reportsData,
    isReportsLoading,
    reportsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isEmpty,
  } = useMissingReports();

  const moreRef = useIntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!hasNextPage) {
        return;
      }
      fetchNextPage();
    }
  });

  return (
    <section className="missing-detail">
      <HeaderWithBackButton />
      {(isLoading || isReportsLoading) && <LoadingCat />}
      {!isLoading && (
        <MissingPostDetail
          post={post as IMissing}
          menuList={{
            remove: removeMissingPost,
          }}
        />
      )}

      {reportsData && <MissingReportPostList posts={reportsData} />}

      <div className="more" ref={moreRef}>
        {isFetchingNextPage && <div>loading...</div>}
      </div>
    </section>
  );
};

export default MissingDetail;
