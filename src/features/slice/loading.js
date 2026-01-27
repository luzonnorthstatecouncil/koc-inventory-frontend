import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	isLoading: false,
	count: 0, // to handle multiple simultaneous loading actions
};

const loadingSlice = createSlice({
	name: "loading",
	initialState,
	reducers: {
		showLoading: (state) => {
			state.count += 1;
			state.isLoading = true;
		},
		hideLoading: (state) => {
			state.count = Math.max(state.count - 1, 0);
			if (state.count === 0) {
				state.isLoading = false;
			}
		},
	},
});

export const { showLoading, hideLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
