import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import ImageUploader from "./ImageUploader";
import NewTags from "./NewTags";
import NewTagForm from "./NewTagForm";
import { ICommunityDetail } from "../../models/community.model";

interface IProps {
  post: ICommunityDetail;
  editPost: (formData: FormData) => void;
}

const PostEditForm = ({ post, editPost }: IProps) => {
  const oldImages = post.images.map((image) => image.url);
  const oldTags = post.tags.map((tag) => tag.tag);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [newTags, setNewTags] = useState<string[]>([...oldTags]);
  const [newImages, setNewImages] = useState<(string | File)[]>(oldImages);

  const [tagsToDelete, setTagsToDelete] = useState<string[]>([]);

  const handleResizeHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "rem";
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "content") {
      setContent(value);
    } else if (name === "title") {
      setTitle(value);
    }
  };

  const removeTags = (indexToRemove: number, tag?: string) => {
    const foundTag = newTags.find((item) => item === tag);

    if (foundTag) {
      setTagsToDelete([...tagsToDelete, foundTag]);
    }

    const filter = newTags.filter((_, index) => index !== indexToRemove);
    setNewTags(filter);
  };

  const addNewTags = (tags: string[]) => {
    setNewTags(tags);
  };

  const handleTagFormOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const setNewImageFiles = <T extends string | File>(images: T[]) => {
    setNewImages([...images]);
  };

  // 삭제할 태그들을 저장합니다.
  const addTagsToDelete = (tags: string[]) => {
    setTagsToDelete([...tags]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    //NOTE 이게 맞나..

    // DB에서 삭제할 태그 ID만 뽑아내기
    const filteredTagIds = post.tags.filter((tag) => tagsToDelete.includes(tag.tag)).map((item) => item.tagId);

    // 새로운 태그 중에 기존 태그에 없는 것만 골라내기
    const filteredTags = newTags.filter((tag) => !oldTags.includes(tag));

    // DB에서 삭제할 이미지 ID만 뽑아내기
    const filteredImageIds = post.images.filter((image) => !newImages.includes(image.url)).map((item) => item.imageId);

    // DB에 저장할 이미지만 골라내기
    const filteredImages = newImages.filter((image): image is File => image instanceof File);

    const formData = new FormData();

    formData.append("title", title);
    formData.append("content", content);
    formData.append("deleteTagIds", JSON.stringify(filteredTagIds) ?? []);
    formData.append("tags", JSON.stringify(filteredTags) ?? []);
    formData.append("deleteImageIds", JSON.stringify(filteredImageIds) ?? []);

    filteredImages.forEach((image) => {
      formData.append("images", image);
    });

    editPost(formData);
  };

  useEffect(() => {
    handleResizeHeight();
  }, [textareaRef.current?.value]);

  return (
    <div className="community-post-write">
      <form onSubmit={handleSubmit} className="post-form">
        <div>
          <input
            className="title"
            name="title"
            value={title}
            onChange={handleChange}
            min={1}
            type="text"
            placeholder="제목"
            required
          />
          <textarea
            onChange={handleChange}
            ref={textareaRef}
            name="content"
            value={content}
            rows={1}
            minLength={1}
            placeholder="내용을 입력해 주세요."
            required
          ></textarea>

          {/* 이미지 업로드 부분 */}
          <ImageUploader newImages={newImages} setNewImageFiles={setNewImageFiles} />

          <div className="hash-tag-wrapper">
            <button type="button" className="hash-tag-btn" onClick={handleTagFormOpen}>
              &#035; 해시태그를 입력해주세요 &#62;
            </button>

            <NewTags tags={newTags} removeTags={removeTags} />
          </div>
        </div>
        <button className="post-submit">수정완료</button>
      </form>

      {isOpen && (
        <NewTagForm
          initialTags={newTags}
          addTagsToDelete={addTagsToDelete}
          addNewTags={addNewTags}
          handleTagFormOpen={handleTagFormOpen}
        />
      )}
    </div>
  );
};

export default PostEditForm;