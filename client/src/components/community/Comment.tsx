import "../../styles/css/components/community/comment.css";
import Avartar from "./Avartar";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IComment } from "../../models/comment.model";
import { formatAgo } from "../../utils/format/format";

//CHECKLIST
// [ ] 회원 정보가 동일할때만 옵션 아이콘 출력
// [ ] 댓글 수정 삭제 구현
interface IProps {
  comment: IComment;
}

const Comment = ({ comment }: IProps) => {
  return (
    <li className="comment-card">
      <div className="comment">
        <Avartar
          profileImage={comment.users.profileImage}
          nickname={comment.users.nickname}
        />
        <div className="detail">
          <div className="comment-info">
            <span className="nickname">{comment.users.nickname}</span>
            <span className="date">{formatAgo(comment.updatedAt)}</span>
            <HiOutlineDotsVertical className="options-icon" />
          </div>
          <pre className="comment-detail">{comment.comment}</pre>
        </div>
      </div>
    </li>
  );
};

export default Comment;
