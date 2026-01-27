/**
 * Generic setState helper for Redux slices
 * Automatically sets the keys in payload to state
 */
export const setState = (key) => {
   if (key) {
      return (state, action) => {
         state[key] = action.payload;
      };
   }

   return (state, action) => {
      Object.keys(action.payload).forEach((key) => {
         state[key] = action.payload[key];
      });
   };
};

/**
 * Clears state to initial values
 */
export const clearStates = (initialState) => {
   return (state) => {
      Object.keys(initialState).forEach((key) => {
         state[key] = initialState[key];
      });
   };
};

/**
 * Clears a specific key in the state to its initial value
 */
export const clearState = (initialState, key) => {
   return (state) => {
      state[key] = initialState[key];
   };
};

/**
 * Add an item to array from state
 */
export const appendArray = (key) => {
   return (state, action) => {
      state[key] = [...state[key], action.payload];
   };
};

/**
 * Update an item to array from state using the id from the item
 */
export const updateArray = (key) => {
   return (state, action) => {
      state[key] = state[key].map((item) => (item.id === action.payload.id ? action.payload.data : item));
   };
};

/**
 * Remove an item from array from state
 */
export const removeArray = (key) => {
   return (state, action) => {
      state[key] = state[key].filter((item) => item.id !== action.payload);
   };
};

export const clearArray = (key) => {
   return (state) => {
      state[key] = [];
   };
};
