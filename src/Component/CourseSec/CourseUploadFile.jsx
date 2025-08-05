import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "../../firebaseConfig";
import Swal from "sweetalert2";
import { Link } from "react-router";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  border: "none",
  boxShadow: "none",
  outline: "none",
};

const CourseUploadFile = ({
  open,
  handleClose,
  courseData,
  isEdit = false,
}) => {
  // Refs for file inputs
  const thumbnailInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // States
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "Beginner",
      duration: "",
      status: "Draft",
    },
  });

  // Initialize form with course data when in edit mode
  useEffect(() => {
    if (isEdit && courseData) {
      setValue("title", courseData.title);
      setValue("description", courseData.description);
      setValue("category", courseData.category);
      setValue("duration", courseData.duration);
      setValue("status", courseData.status);
      setThumbnail(courseData.thumbnail);
      setExistingAttachments(courseData.attachments || []);
      if (courseData.quizQuestions) {
        setQuizQuestions(courseData.quizQuestions);
      }
    } else {
      // Reset form when creating new course
      reset();
      setThumbnail(null);
      setThumbnailFile(null);
      setAttachments([]);
      setExistingAttachments([]);
      setQuizQuestions([]);
    }
  }, [isEdit, courseData, setValue, reset]);

  // Handle status change
  const handleStatusChange = (status) => {
    setValue("status", status);
  };

  // Quiz related functions
  const addNewQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[index][field] = value;
    setQuizQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuizQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, answerIndex) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[questionIndex].correctAnswer = answerIndex;
    setQuizQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions.splice(index, 1);
    setQuizQuestions(updatedQuestions);
  };

  // Thumbnail handlers
  const handleThumbnailClick = () => thumbnailInputRef.current.click();
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      processFile(file, setThumbnail);
    }
  };
  const handleThumbnailDragOver = (e) => {
    e.preventDefault();
    setIsDraggingThumbnail(true);
  };
  const handleThumbnailDragLeave = () => setIsDraggingThumbnail(false);
  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setThumbnailFile(file);
      processFile(file, setThumbnail);
    }
  };

  // Attachment handlers
  const handleAttachmentClick = () => attachmentInputRef.current.click();
  const handleAttachmentChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };
  const handleAttachmentDragOver = (e) => {
    e.preventDefault();
    setIsDraggingAttachment(true);
  };
  const handleAttachmentDragLeave = () => setIsDraggingAttachment(false);
  const handleAttachmentDrop = (e) => {
    e.preventDefault();
    setIsDraggingAttachment(false);
    const newFiles = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  // Remove attachment
  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing attachment
  const handleRemoveExistingAttachment = async (index, url) => {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);

      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
      Swal.fire({
        title: "Error deleting attachment",
        text: "The file was removed from the list but might still exist in storage",
        icon: "error",
        customClass: {
          popup: "poppins",
        },
      });
    }
  };

  // Process file (for thumbnails)
  const processFile = (file, setter) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setter(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let thumbnailUrl = thumbnail;
      let attachmentUrls = [...existingAttachments];

      // 1. Upload new thumbnail if changed
      if (thumbnailFile) {
        if (isEdit && courseData.thumbnail) {
          try {
            const oldThumbnailRef = ref(storage, courseData.thumbnail);
            await deleteObject(oldThumbnailRef);
          } catch (error) {
            console.error("Error deleting old thumbnail:", error);
          }
        }

        const thumbnailBlob = await fetch(thumbnail).then((r) => r.blob());
        const thumbnailRef = ref(storage, `thumbnails/${uuidv4()}`);
        const thumbnailSnapshot = await uploadBytes(
          thumbnailRef,
          thumbnailBlob
        );
        thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
      }

      // 2. Upload new attachments
      if (attachments.length > 0) {
        const newAttachmentUrls = await Promise.all(
          attachments.map(async (file) => {
            const attachmentRef = ref(
              storage,
              `attachments/${uuidv4()}_${file.name}`
            );
            const snapshot = await uploadBytes(attachmentRef, file);
            return await getDownloadURL(snapshot.ref);
          })
        );
        attachmentUrls = [...attachmentUrls, ...newAttachmentUrls];
      }

      // 3. Save course data
      const courseDataToSave = {
        title: data.title,
        description: data.description,
        category: data.category,
        duration: data.duration,
        status: data.status,
        thumbnail: thumbnailUrl,
        attachments: attachmentUrls,
        quizQuestions: quizQuestions.length > 0 ? quizQuestions : null,
        updatedAt: new Date(),
      };

      if (isEdit && courseData.id) {
        // Update existing course
        await updateDoc(doc(db, "courses", courseData.id), courseDataToSave);
        Swal.fire({
          title: "Course Updated Successfully!",
          icon: "success",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
          customClass: {
            popup: "poppins",
          },
        });
      } else {
        // Create new course
        courseDataToSave.createdAt = new Date();
        const docRef = await addDoc(
          collection(db, "courses"),
          courseDataToSave
        );
        console.log("Course created with ID: ", docRef.id);
        Swal.fire({
          title: "Course Created Successfully!",
          icon: "success",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
          customClass: {
            popup: "poppins",
          },
        });
      }

      // Reset form after successful submission
      if (!isEdit) {
        reset();
        setThumbnail(null);
        setThumbnailFile(null);
        setAttachments([]);
        setExistingAttachments([]);
        setQuizQuestions([]);
      }
      handleClose();
    } catch (error) {
      console.error("Error saving course: ", error);
      Swal.fire({
        title: isEdit ? "Error updating course" : "Error creating course",
        text: "Please try again",
        icon: "error",
        customClass: {
          popup: "poppins",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          <div className="upload-container">
            <div className="xmark">
              <p>{isEdit ? "Edit Course" : "Add New Course"}</p>
              <FontAwesomeIcon
                onClick={handleClose}
                className="xmarks"
                icon={faXmark}
              />
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="upload-file">
                <div className="upload-content">
                  <div className="upload-title">
                    <p className="title">Course Title</p>
                    <input
                      type="text"
                      {...register("title", {
                        required: "Course title is required",
                      })}
                      className="input-title"
                      placeholder="Enter Course title"
                    />
                    {errors.title && (
                      <p className="error-message">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="upload-description">
                    <p className="description">Description</p>
                    <textarea
                      {...register("description", {
                        required: "Description is required",
                      })}
                      placeholder="Enter Your Description"
                      className="textarea input-title"
                      rows={10}
                      cols={50}
                    ></textarea>
                    {errors.description && (
                      <p className="error-message">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="drop">
                    <p>Category</p>
                    <select
                      className="select"
                      {...register("category", {
                        required: "Category is required",
                      })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advance">Advance</option>
                    </select>
                    {errors.category && (
                      <p className="error-message">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="upload-duration">
                    <p>Duration</p>
                    <input
                      type="text"
                      {...register("duration", {
                        required: "Duration is required",
                      })}
                      placeholder="e.g 4 weeks"
                      className="input-title"
                    />
                    {errors.duration && (
                      <p className="error-message">{errors.duration.message}</p>
                    )}
                  </div>
                </div>

                <div className="upload-drag">
                  <div className="thumbnail-uploader-wrapper">
                    <p className="thumbnail-label">Thumbnail</p>
                    <div
                      className={`dragings ${
                        isDraggingThumbnail ? "dragging-active" : ""
                      }`}
                      onClick={handleThumbnailClick}
                      onDragOver={handleThumbnailDragOver}
                      onDragLeave={handleThumbnailDragLeave}
                      onDrop={handleThumbnailDrop}
                    >
                      {thumbnail ? (
                        <div className="thumbnail-container">
                          <img
                            src={thumbnail}
                            alt="Thumbnail preview"
                            className="thumbnail-preview"
                          />
                        </div>
                      ) : (
                        <p className="drag">
                          Drag and drop or click to upload thumbnail
                        </p>
                      )}
                      <input
                        type="file"
                        ref={thumbnailInputRef}
                        onChange={handleThumbnailChange}
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                    </div>
                    {!thumbnail && (
                      <p className="error-message">Thumbnail is required</p>
                    )}
                  </div>

                  <div className="draging">
                    <p>Attachments (Lesson Files)</p>
                    <div
                      className={`dragings ${
                        isDraggingAttachment ? "dragging-active" : ""
                      }`}
                      onClick={handleAttachmentClick}
                      onDragOver={handleAttachmentDragOver}
                      onDragLeave={handleAttachmentDragLeave}
                      onDrop={handleAttachmentDrop}
                    >
                      <p className="drag">
                        Drag and drop or click to upload files
                      </p>
                      <input
                        type="file"
                        ref={attachmentInputRef}
                        onChange={handleAttachmentChange}
                        style={{ display: "none" }}
                        multiple
                      />
                    </div>

                    {/* Display existing attachments (edit mode) */}
                    {existingAttachments.length > 0 && (
                      <div className="attachments-list">
                        <p>Existing Files:</p>
                        <ul>
                          {existingAttachments.map((url, index) => {
                            const fileName = url.split("/").pop().split("?")[0];
                            return (
                              <li key={`existing-${index}`}>
                                {fileName}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveExistingAttachment(index, url)
                                  }
                                  className="remove-attachment"
                                >
                                  <FontAwesomeIcon icon={faXmark} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Display new attachments */}
                    {attachments.length > 0 && (
                      <div className="attachments-list">
                        <p>New Files to Upload:</p>
                        <ul>
                          {attachments.map((file, index) => (
                            <li key={`new-${index}`}>
                              {file.name}
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="remove-attachment"
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  
                  <div className="draging">
                    <p>Status</p>
                    <div className="upload-check">
                      <label>
                        <input
                          type="radio"
                          name="status"
                          checked={watch("status") === "Draft"}
                          onChange={() => handleStatusChange("Draft")}
                        />
                        <span>Draft</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="status"
                          checked={watch("status") === "Active"}
                          onChange={() => handleStatusChange("Active")}
                        />
                        <span>Active</span>
                      </label>
                    </div>
                    <input type="hidden" {...register("status")} />
                  </div>

                  <div className="upload-btn">
                    <button
                      type="button"
                      className="cancel"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save"
                      disabled={isLoading || !thumbnail}
                    >
                      {isLoading
                        ? "Processing..."
                        : isEdit
                        ? "Update Course"
                        : "Save Course"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </Typography>
      </Box>
    </Modal>
  );
};

export default CourseUploadFile;