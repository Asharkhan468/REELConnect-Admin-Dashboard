import React, { useState } from "react";
import "./User.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useForm, Controller } from "react-hook-form";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Toast from "../Toast/Toast";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: "none",
  border: "none",
  outline: "none",
};

const UserAddForm = (userData) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const addUser = async (user) => {
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      const uid = userCredential.user.uid;

      // 2. Create user in Firestore (excluding password)
      const userData = {
        userId: uid,
        fullname: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: null,
        isDeactivated: false,
        expertise: "",
        createdAt: new Date(),
        deactivatedAt: null,
      };

      const usersRef = doc(db, "users", uid); // Use uid as document ID
      await setDoc(usersRef, userData);

      setToast({
        type: "success",
        message: "User created Sucessfully!",
      });
      setValue("fullName", "");
      setValue("phone", "");
      setValue("role", "");
      setValue("email", "");
      setValue("password", "");
      setValue("confirmPassword", "");

      setOpen(false);
    } catch (error) {
      setToast({
        type: "error",
        message: error.message,
      });
    }

    setTimeout(() => setToast(null), 3000);
  };

  const onSubmit = async (data) => {
    console.log(data);
    addUser(data);
  };

  return (
    <>
      <div className="icon-footer">
        <img
          className="add-icon"
          onClick={handleOpen}
          src="/images/plus.svg"
          alt=""
        />
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            <div className="modal">
              <div className="xmark">
                <p>Add User</p>
                <FontAwesomeIcon
                  onClick={handleClose}
                  className="xmarks"
                  icon={faXmark}
                />
              </div>

              <div className="modal-input">
                <p>Full Name</p>
                <input
                  type="text"
                  {...register("fullName", { required: true })}
                  placeholder="Full Name"
                  className="email"
                />
                {errors.fullName && (
                  <span className="required"> FullName is required </span>
                )}
              </div>

              <div className="modal-input">
                <p>Email Address</p>
                <input
                  type="text"
                  {...register("email", { required: true })}
                  placeholder="Email Adderss"
                  className="email"
                />
                {errors.email && (
                  <span className="required"> Email is required </span>
                )}
              </div>

              <div className="modal-input">
                <p>Password</p>
                <input
                  type="password"
                  {...register("password", { required: true })}
                  placeholder="Password"
                />
                {errors.password && (
                  <span className="required"> Password is required </span>
                )}
              </div>

              <div className="modal-input">
                <p>Confirm Password</p>
                <input
                  type="password"
                  {...register("confirmPassword", {
                    required: "Confirm Password is required",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  placeholder="Confirm Password"
                />
                {errors.confirmPassword && (
                  <span className="required">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <div className="modal-input">
                <p>Phone no :</p>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <PhoneInput
  {...field}
  country={"pk"}
  enableSearch={true}
  containerStyle={{
    width: "100%",
  }}
  inputStyle={{
    width: "100%",
    padding: "22px 10px 22px 60px", // left padding added for country code
    border: "1px solid red",
    outline: "none",
    borderRadius: "5px",
    boxSizing: "border-box",
  }}
  buttonStyle={{
    border: "1px solid red",
    borderRight: "none",
    borderRadius: "5px 0 0 5px",
    backgroundColor: "white",
  }}
  placeholder="Enter phone number"
  onChange={field.onChange}
  value={field.value}
/>


                  )}
                />
                {errors.phone && (
                  <span className="required">Phone Number is required</span>
                )}
              </div>

              <div className="modal-input">
                <p>Full Name</p>
                <select
                  {...register("role", { required: true })}
                  className="modal-dropdown"
                >
                  <option value="">Select a name</option>
                  <option value="Parent">Parent</option>
                  <option value="Student">Student</option>
                  <option value="Mentor">Mentor</option>
                </select>

                {errors.role && (
                  <span className="required">Full Name is required</span>
                )}
              </div>

              <div>
                <button onClick={handleSubmit(onSubmit)} className="modal-btn">
                  Add User
                </button>
              </div>
            </div>
            {toast && <Toast type={toast.type} message={toast.message} />}{" "}
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default UserAddForm;
