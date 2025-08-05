import React from "react";
import Swal from "sweetalert2";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Course.css";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const CourseDeleteBtn = (props) => {
  const handleDelete = (courseId) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33", // Red delete button
    cancelButtonColor: "#808080", // Gray cancel button
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    buttonsStyling: true,
    reverseButtons: true, // Places cancel button on the left
    customClass: {
      popup: "poppins",
      confirmButton: "poppins",
      cancelButton: "poppins",
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const courseDocRef = doc(db, "courses", courseId);
        await deleteDoc(courseDocRef);

        // Success message (red confirm button)
        Swal.fire({
          title: "Deleted!",
          text: "Your course has been deleted.",
          icon: "success",
          confirmButtonColor: "#d33", // Red button
          customClass: {
            popup: "poppins",
            confirmButton: "poppins",
          },
        });

        console.log("Course deleted successfully");
      } catch (error) {
        console.error("Error deleting course: ", error);
        Swal.fire({
          title: "Error!",
          text: "There was a problem deleting the course.",
          icon: "error",
          confirmButtonColor: "#808080", // Gray button for error
          customClass: {
            popup: "poppins",
            confirmButton: "poppins",
          },
        });
      }
    }
  });
};

  return (
    <div
      onClick={(result) => handleDelete(props.id)}
      style={{ cursor: "pointer" }}
    >
      <FontAwesomeIcon icon={faTrash} />
    </div>
  );
};

export default CourseDeleteBtn;
