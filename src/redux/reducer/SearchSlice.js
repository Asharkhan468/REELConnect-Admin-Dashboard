import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  setSearch: "",
};

const searchSlice = createSlice({
  name: "Search",
  initialState,
  reducers: {
    setSearch: (state , action) => {
      state.setSearch = action.payload;
    },
  },
});

export const { setSearch } = searchSlice.actions;
export default searchSlice.reducer;
