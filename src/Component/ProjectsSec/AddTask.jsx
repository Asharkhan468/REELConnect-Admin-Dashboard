import React, { useState } from "react";
import { Close as CloseIcon } from "@mui/icons-material";

const AddTaskModal = ({ open, onClose, onAddTask, user }) => {
  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskName.trim() && assignedTo.trim()) {
      onAddTask({
        taskName,
        assignedTo,
        isChecked: false,
        id: Date.now(),
      });
      setTaskName("");
      setAssignedTo("");
      onClose();
    }
  };

  if (!open) return null;

  // Enhanced field styles with more padding and prominent borders
  const fieldStyles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      marginBottom: "0.75rem" // Slightly increased margin
    },
    label: {
      fontSize: "0.95rem",
      color: "#333",
      fontWeight: 500,
      marginLeft: "2px"
    },
    input: {
      padding: "0.875rem 1.125rem", // Increased padding (originally 0.75rem 1rem)
      borderRadius: "8px",
      border: "1.5px solid #bbb", // Thicker and darker border
      fontSize: "0.95rem",
      width: "100%",
      boxSizing: "border-box",
      transition: "all 0.2s ease",
      height: "auto", // Let it expand with padding
      minHeight: "44px" // Minimum touch target size
    },
    focus: {
      borderColor: "#1976d2",
      borderWidth: "1.5px",
      boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)", // More prominent focus
      outline: "none"
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          width: "95%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "1.75rem", // Slightly increased container padding
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.75rem", // Increased margin
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
              color: "#333",
            }}
          >
            ✏️ Add New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              padding: "0.5rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <CloseIcon />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem", // Increased gap between form elements
          }}
        >
          {/* Task Name Field */}
          <div style={fieldStyles.container}>
            <label htmlFor="task-name" style={fieldStyles.label}>
              Task Name *
            </label>
            <input
              id="task-name"
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              style={fieldStyles.input}
              onFocus={(e) => {
                e.target.style.borderColor = fieldStyles.focus.borderColor;
                e.target.style.borderWidth = fieldStyles.focus.borderWidth;
                e.target.style.boxShadow = fieldStyles.focus.boxShadow;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#bbb";
                e.target.style.borderWidth = "1.5px";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Assign To Field */}
          <div style={fieldStyles.container}>
            <label htmlFor="assign-to" style={fieldStyles.label}>
              Assign To *
            </label>
            <select
              id="assign-to"
              required
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{
                ...fieldStyles.input,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1.125rem center", // Adjusted to match new padding
                backgroundSize: "1em",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = fieldStyles.focus.borderColor;
                e.target.style.borderWidth = fieldStyles.focus.borderWidth;
                e.target.style.boxShadow = fieldStyles.focus.boxShadow;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#bbb";
                e.target.style.borderWidth = "1.5px";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Select a user</option>
              {user.map((user, index) => (
                <option key={index} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.75rem", // Increased button padding
                borderRadius: "8px",
                border: "1.5px solid #ddd", // Thicker border
                backgroundColor: "transparent",
                color: "#333",
                fontSize: "0.95rem", // Slightly larger font
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                height: "auto",
                minHeight: "44px" // Minimum touch target size
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.borderColor = "#ccc";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#ddd";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "0.75rem 1.75rem", // Increased button padding
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#dc2626",
                color: "#fff",
                fontSize: "0.95rem", // Slightly larger font
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                height: "auto",
                minHeight: "44px", // Minimum touch target size
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;