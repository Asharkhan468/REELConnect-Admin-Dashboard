import { useState, useEffect } from "react";
import Swal from "sweetalert2";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import QuizAnalytics from "./QuizAnalytics";
import "./Quiz.css";
import { faTrash, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSelector } from "react-redux";

const QuizManagement = () => {
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizName, setQuizName] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", ""], correctAnswer: 0 },
  ]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]); // For storing all quizzes before filtering
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState(null);

  const search = useSelector((state) => state.search.setSearch);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      const querySnapshot = await getDocs(collection(db, "courses"));
      const coursesData = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() });
      });
      setCourses(coursesData);
    };
    fetchCourses();
  }, []);

  // Fetch quizzes when selected course changes
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (selectedCourse) {
        const courseRef = doc(db, "courses", selectedCourse);
        const quizzesRef = collection(courseRef, "quizzes");
        const querySnapshot = await getDocs(quizzesRef);
        const quizzesData = [];
        querySnapshot.forEach((doc) => {
          quizzesData.push({ id: doc.id, ...doc.data() });
        });
        setAllQuizzes(quizzesData);
        setQuizzes(quizzesData);
      } else {
        setAllQuizzes([]);
        setQuizzes([]);
      }
    };
    fetchQuizzes();
  }, [selectedCourse]);

  // Filter quizzes based on search term
  useEffect(() => {
    if (search && search.trim() !== "") {
      const filtered = allQuizzes.filter((quiz) =>
        quiz.name.toLowerCase().includes(search.toLowerCase())
      );
      setQuizzes(filtered);
    } else {
      setQuizzes(allQuizzes);
    }
  }, [search, allQuizzes]);

  const handleAddQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      { question: "", options: ["", ""], correctAnswer: 0 },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[index][field] = value;
    setQuizQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuizQuestions(updatedQuestions);
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[qIndex].options.push("");
    setQuizQuestions(updatedQuestions);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...quizQuestions];
    updatedQuestions[qIndex].options.splice(oIndex, 1);

    // Adjust correctAnswer if needed
    if (updatedQuestions[qIndex].correctAnswer >= oIndex) {
      updatedQuestions[qIndex].correctAnswer = Math.max(
        0,
        updatedQuestions[qIndex].correctAnswer - 1
      );
    }

    setQuizQuestions(updatedQuestions);
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();

    // Validate that all questions have at least 2 options
    const isValid = quizQuestions.every(
      (q) =>
        q.options.length >= 2 &&
        q.options.every((opt) => opt.trim() !== "") &&
        q.question.trim() !== ""
    );

    if (!isValid) {
      Swal.fire({
        title: "Invalid Input!",
        text: "Please make sure each question has at least 2 non-empty options and all questions are filled.",
        icon: "warning",
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      const courseRef = doc(db, "courses", selectedCourse);
      const quizzesRef = collection(courseRef, "quizzes");

      const newQuiz = {
        name: quizName,
        questions: quizQuestions,
        createdAt: new Date(),
      };

      if (isEditing && currentQuizId) {
        // Update existing quiz
        const quizRef = doc(quizzesRef, currentQuizId);
        await updateDoc(quizRef, newQuiz);

        Swal.fire({
          title: "Updated!",
          text: "Quiz updated successfully.",
          icon: "success",
          confirmButtonColor: "#4caf50",
          customClass: {
            popup: "poppins",
          },
        });
      } else {
        // Add new quiz
        await addDoc(quizzesRef, newQuiz);

        Swal.fire({
          title: "Created!",
          text: "Quiz created successfully.",
          icon: "success",
          confirmButtonColor: "#4caf50",
           customClass:{
          popup:'poppins'
        }
        });
      }

      // Refresh quizzes list
      const querySnapshot = await getDocs(quizzesRef);
      const quizzesData = [];
      querySnapshot.forEach((doc) => {
        quizzesData.push({ id: doc.id, ...doc.data() });
      });
      setAllQuizzes(quizzesData);
      setQuizzes(quizzesData);

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error saving quiz: ", error);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong while saving the quiz.",
        icon: "error",
        confirmButtonColor: "#d33",
        customClass: {
          popup: "poppins",
        },
      });
    }
  };

  //close analytics when user click back button on browser

  useEffect(() => {
    const handleBackButton = (e) => {
      e.preventDefault();

      setShowAnalytics(false);
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  const handleViewAnalytics = (quiz ) => {
    setSelectedQuiz(quiz);
    setShowAnalytics(true);
  };

  const handleEditQuiz = (quiz) => {
    setQuizName(quiz.name);
    setQuizQuestions(quiz.questions);
    setIsEditing(true);
    setCurrentQuizId(quiz.id);
    setShowQuizForm(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This quiz will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // red
      cancelButtonColor: "#808080", // gray
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      customClass: {
        popup: "poppins", // optional custom font class
      },
    });

    if (result.isConfirmed) {
      try {
        const courseRef = doc(db, "courses", selectedCourse);
        const quizRef = doc(collection(courseRef, "quizzes"), quizId);
        await deleteDoc(quizRef);

        // Refresh quizzes list
        const quizzesRef = collection(courseRef, "quizzes");
        const querySnapshot = await getDocs(quizzesRef);
        const quizzesData = [];
        querySnapshot.forEach((doc) => {
          quizzesData.push({ id: doc.id, ...doc.data() });
        });
        setAllQuizzes(quizzesData);
        setQuizzes(quizzesData);

        Swal.fire({
          title: "Deleted!",
          text: "The quiz has been deleted.",
          icon: "success",
          confirmButtonColor: "#4caf50",
          customClass: {
            popup: "poppins",
          },
        });
      } catch (error) {
        console.error("Error deleting quiz: ", error);
        Swal.fire({
          title: "Error!",
          text: "Something went wrong while deleting.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const handleRemoveQuestion = (index) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setQuizName("");
    setQuizQuestions([{ question: "", options: ["", ""], correctAnswer: 0 }]);
    setShowQuizForm(false);
    setIsEditing(false);
    setCurrentQuizId(null);
  };

  if (showAnalytics && selectedQuiz) {
    return (
      <QuizAnalytics
        quiz={selectedQuiz}
        onBack={() => setShowAnalytics(false)}
      />
    );
  }


  return (
    <div className="quiz-management-container">
      {!showQuizForm ? (
        <div className="quiz-dashboard">
          <h2>Course Quizzes</h2>
          <p>Select a course to view or create quizzes</p>

          <div className="course-selection">
            <select
              className="select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && quizzes.length !== 0 ? (
            <>
              <div className="quizzes-table-container">
                <table className="quizzes-table">
                  <thead>
                    <tr>
                      <th>Quiz Name</th>
                      <th>Questions</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id}>
                        <td data-label="Quiz Name">{quiz.name}</td>
                        <td data-label="Questions">{quiz.questions.length}</td>
                        <td data-label="Created At">
                          {quiz.createdAt?.toDate().toLocaleDateString()}
                        </td>
                        <td data-label="Actions" className="actions-cell">
                          <button
                            onClick={() => handleViewAnalytics(quiz)}
                            className="analytics-btn"
                          >
                            Analytics
                          </button>
                          <div className="action-icons">
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              className="icon-btn"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="icon-btn delete-btn"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="no-course-message">
              {selectedCourse
                ? "No quiz found for this course"
                : "Please select a course"}
            </div>
          )}

          {selectedCourse && (
            <div className="icon-footers">
              <img
                className="add-icons"
                onClick={() => setShowQuizForm(true)}
                src="/images/plus.svg"
                alt="Add new course"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="quiz-creation-form">
          <h2>{isEditing ? "Edit Quiz" : "Create New Quiz"}</h2>

          <form onSubmit={handleSubmitQuiz}>
            <div className="form-group">
              <label>Quiz Name:</label>
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                required
              />
            </div>

            <div className="questions-container">
              {quizQuestions.map((q, qIndex) => (
                <div key={qIndex} className="question-card">
                  <div className="question-header">
                    <h3>Question {qIndex + 1}</h3>
                    {quizQuestions.length > 1 && (
                      <button
                        type="button"
                        className="remove-question-btn"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        title="Remove Question"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Question Text:</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "question", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="options-group">
                    <label>Options:</label>
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-input">
                        <input
                          type="radio"
                          name={`correctAnswer-${qIndex}`}
                          className="custom-radio"
                          checked={q.correctAnswer === oIndex}
                          onChange={() =>
                            handleQuestionChange(
                              qIndex,
                              "correctAnswer",
                              oIndex
                            )
                          }
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(qIndex, oIndex, e.target.value)
                          }
                          required
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            className="remove-option-btn"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            title="Remove Option"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-option-btn"
                      onClick={() => handleAddOption(qIndex)}
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="submit-quiz-btn"
              >
                Add Question
              </button>

              <button type="submit" className="submit-quiz-btn">
                {isEditing ? "Update Quiz" : "Create Quiz"}
              </button>

              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;
