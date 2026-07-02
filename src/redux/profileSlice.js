import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProfileApi,
  // getProfileImageApi,
  updateProfileApi,
  uploadProfileImageApi,
  changePasswordRequestApi,
  changePasswordVerifyApi,
} from "../services/apiCalls";

// export const fetchProfile = createAsyncThunk(
//   "profile/fetch",
//   async (_, { rejectWithValue }) => {
//     try {
//       const [profileData, imageData] = await Promise.all([
//         getProfileApi(),
//         getProfileImageApi(),
//       ]);

//       return {
//         ...profileData,
//         profile_image: imageData?.profile_image || profileData.profile_image,
//       };
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to fetch profile",
//       );
//     }
//   },
// );

// export const fetchProfile = createAsyncThunk(
//   "profile/fetch",
//   async (_, { rejectWithValue }) => {
//     try {
//       const profileData = await getProfileApi();

//       let imageData = null;

//       try {
//         imageData = await getProfileImageApi();
//       } catch (err) {
//         // ignore 404 error (no image)
//         console.warn("No profile image found");
//       }

//       return {
//         ...profileData,
//         profile_image:
//           imageData?.profile_image || profileData.profile_image || null,
//       };
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to fetch profile",
//       );
//     }
//   },
// );

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const profileData = await getProfileApi();
      return profileData;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

// export const fetchProfile = createAsyncThunk(
//   "profile/fetch",
//   async (_, { rejectWithValue }) => {
//     try {
//       const profileData = await getProfileApi();

//       let imageData = null;

//       // Only call if backend says image exists
//       if (profileData.has_profile_image) {
//         try {
//           imageData = await getProfileImageApi();
//         } catch (err) {
//           // silently ignore
//         }
//       }

//       return {
//         ...profileData,
//         profile_image: imageData?.profile_image || null,
//       };
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to fetch profile",
//       );
//     }
//   },
// );

export const updateProfile = createAsyncThunk(
  "profile/update",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await updateProfileApi(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  },
);

export const uploadProfileImage = createAsyncThunk(
  "profile/uploadImage",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadProfileImageApi(formData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Image upload failed",
      );
    }
  },
);

export const changePasswordRequest = createAsyncThunk(
  "profile/changePasswordRequest",
  async (data, { rejectWithValue }) => {
    try {
      return await changePasswordRequestApi(data);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Request failed");
    }
  },
);

export const changePasswordVerify = createAsyncThunk(
  "profile/changePasswordVerify",
  async (data, { rejectWithValue }) => {
    try {
      return await changePasswordVerifyApi(data);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Verification failed");
    }
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    user: null,
    loading: false,
    error: null,
    passwordLoading: false,
    otpLoading: false,
  },
  reducers: {
    clearProfile: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })

      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        if (state.user) {
          state.user.profile_image = action.payload.profile_image;
        }
      })
      .addCase(changePasswordRequest.pending, (state) => {
        state.passwordLoading = true;
      })
      .addCase(changePasswordRequest.fulfilled, (state) => {
        state.passwordLoading = false;
      })
      .addCase(changePasswordRequest.rejected, (state, action) => {
        state.passwordLoading = false;
        state.error = action.payload;
      })

      .addCase(changePasswordVerify.pending, (state) => {
        state.otpLoading = true;
      })
      .addCase(changePasswordVerify.fulfilled, (state) => {
        state.otpLoading = false;
      })
      .addCase(changePasswordVerify.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
