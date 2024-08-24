import { useNavigate } from "react-router-dom";
import {
  IMenuList,
  IMissing,
  IMissingReport,
} from "../../../models/missing.model";
import { formatDate } from "../../../utils/format/format";
import Avartar from "../../common/Avartar";
import "./../../../styles/scss/components/missing/postHead.scss";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useState } from "react";
import PostMenu from "../../communityAndEvent/PostMenu";

export interface IMissingComponentProps {
  data: IMissing | IMissingReport;
  navigateUser?: boolean;
  menuList?: IMenuList;
}

export const isMissing = (data: IMissing | IMissingReport): data is IMissing =>
  (data as IMissing).missingCats ? true : false;

const PostHead = ({ data, navigateUser, menuList }: IMissingComponentProps) => {
  const navigate = useNavigate();
  const navigateToUser = () =>
    navigateUser ? navigate(`/users/${1234}/profile`) : null; //  내비게이트값 변경 (-)

  const [isShowMenu, setIsShowMenu] = useState<
    "missing" | "missingReport" | ""
  >("");
  const showMenu = () => {
    setIsShowMenu((prev) =>
      prev ? "" : isMissing(data) ? "missing" : "missingReport"
    );
  };

  return (
    <section className="missing-post-head" key={data.postId}>
      <Avartar
        profileImage={data.users.profileImage}
        nickname={data.users.nickname}
        onClick={navigateToUser}
      />

      <div className="post-title" onClick={navigateToUser}>
        <div className="user-cat-name">
          {isMissing(data) && (
            <p>
              {data.users.nickname} 님네 {data.missingCats.name}
            </p>
          )}
          {!isMissing(data) && <p>{data.users.nickname} 님의 제보</p>}
        </div>
        <div className="created-at">
          <p>{formatDate(data.createdAt)}</p>
          {data.createdAt === data.updatedAt ? null : <p>(수정됨)</p>}
        </div>
      </div>
      {!isMissing(data) && (
        <div className="match-check">
          <p className={`match-is-${data.match}`}>
            {data.match === "Y"
              ? "일치"
              : data.match === "N"
              ? "불일치"
              : "확인중"}
          </p>
        </div>
      )}
      <HiOutlineDotsVertical className="options-icon" onClick={showMenu} />
      <PostMenu
        boardType={isMissing(data) ? "missing" : "missingReport"}
        menuType="post"
        postId={data.postId}
        showMenu={showMenu}
        isShowMenu={isShowMenu ? true : false}
        // deletePost={(menuList as IMenuList).remove}
      />
    </section>
  );
};

export default PostHead;