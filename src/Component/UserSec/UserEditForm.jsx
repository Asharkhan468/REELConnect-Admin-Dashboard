import { useForm, Controller } from "react-hook-form";
import React, { useEffect, useState } from "react";
import "./User.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Toast from "../Toast/Toast";

const UserEditForm = ({ userData, open, setOpen }) => {

    
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
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm();

  const [toast, setToast] = useState(null);

  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (userData) {
      setValue("fullName", userData.fullname);
      setValue("phone", userData.phone);
      setValue("role", userData.role);
    }
  }, [userData, setValue]);

  const updateUser = async (data) => {
    try {
      const userRef = doc(db, "users", userData.userId);
      await updateDoc(userRef, {
        fullname: data.fullName,
        phone: data.phone,
        role: data.role,
      });

      setToast({ type: "success", message: "User updated successfully!" });
      handleClose();
    } catch (error) {
      setToast({ type: "error", message: error.message });
    }

    setTimeout(() => setToast(null), 3000);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6">
          <div className="modal">
            <div className="xmark">
              <p>Edit User</p>
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
                />
                {errors.fullName && (
                  <span className="required">Full Name is required</span>
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
                      enableSearch
                      inputStyle={{ width: "100%" }}
                      placeholder="Enter phone number"
                    />
                  )}
                />
                {errors.phone && (
                  <span className="required">Phone Number is required</span>
                )}
              </div>

              
              <div className="modal-input">
                <p>Role</p>
                <select
                  {...register("role", { required: true })}
                  className="modal-dropdown"
                >
                  <option value="">Select role</option>
                  <option value="Parent">Parent</option>
                  <option value="Student">Student</option>
                  <option value="Mentor">Mentor</option>
                </select>
                {errors.role && (
                  <span className="required">Role is required</span>
                )}
              </div>


            <div>
              <button onClick={handleSubmit(updateUser)} className="modal-btn">
                Update User
              </button>
            </div>
          </div>

          {toast && <Toast type={toast.type} message={toast.message} />}
        </Typography>
      </Box>
    </Modal>
  );
};
export default UserEditForm