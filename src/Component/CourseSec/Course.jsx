import React, { useState, useEffect } from "react";
import "./Course.css";
import CourseDeleteBtn from "./CourseDeleteBtn";
import CourseEditBtn from "./CourseEditBtn";
import CourseUploadFile from "./CourseUploadFile";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useSelector } from "react-redux";

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const search = useSelector((state) => state.search.setSearch);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);
      setFilteredCourses(coursesData); // Initialize filtered courses
    });
    return () => unsubscribe();
  }, []);

  // Filter courses based on search term
  useEffect(() => {
    if (!search || search.trim() === "") {
      setFilteredCourses(courses);
      setCurrentPage(1); // Reset to first page when search is cleared
    } else {
      const searchTerm = search.toLowerCase();
      const filtered = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.category.toLowerCase().includes(searchTerm)
      );
      setFilteredCourses(filtered);
      setCurrentPage(1); // Reset to first page when new search is performed
    }
  }, [search, courses]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  // Get current courses
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = filteredCourses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  return (
    <>
      {/* Create Course Button */}
      <div className="icon-footers">
        <img
          className="add-icons"
          onClick={() => setIsCreateModalOpen(true)}
          src="/images/plus.svg"
          alt="Add new course"
        />
      </div>

      {/* Create Course Modal */}
      <CourseUploadFile
        open={isCreateModalOpen}
        handleClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Course Modal */}
      {selectedCourse && (
        <CourseUploadFile
          open={isEditModalOpen}
          handleClose={() => setIsEditModalOpen(false)}
          isEdit={true}
          courseData={selectedCourse}
        />
      )}

      {/* Courses Table */}
      <div className="table-container">
        <table className="course-table">
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Status</th>
              <th className="action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCourses.length > 0 ? (
              currentCourses.map((course, idx) => (
                <tr key={idx} className="table-row">
                  <td data-label="Course Title">
                    <div className="course-info">
                      <img
                        src={course.thumbnail}
                        alt="Course"
                        className="course-img"
                      />
                      <span className="span-title">{course.title}</span>
                    </div>
                  </td>
                  <td data-label="Category" className="category">
                    {course.category}
                  </td>
                  <td data-label="Duration" className="duration">
                    {course.duration}
                  </td>
                  <td data-label="Status">
                    <span className={`status ${course.status.toLowerCase()}`}>
                      {course.status}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <span className="action-icons">
                      <CourseDeleteBtn id={course.id} />
                      <CourseEditBtn onClick={() => handleEditClick(course)} />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    {courses.length === 0
                      ? "No courses found"
                      : "No matching courses found"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="paginations">
            <button
              className="page-btn"
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
            >
              ◀
            </button>

            {pageNumbers.map((number) => (
              <button
                key={number}
                className={`page-btn ${currentPage === number ? "active" : ""}`}
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            ))}

            <button
              className="page-btn"
              onClick={() =>
                paginate(
                  currentPage < totalPages ? currentPage + 1 : totalPages
                )
              }
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Course;
