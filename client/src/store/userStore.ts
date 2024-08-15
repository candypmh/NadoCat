import {create} from "zustand";

interface StoreState{
  isLoggedIn: boolean;
  isAutoLogin: boolean;
  authType: string | null;
  storeLogin: (generalToken: string) => void;
  storeAutoLogin: (refreshToken: string) => void;
  storeAuthType: (authType: string) => void;
  storeLogout: () => void;
}

export const getGeneralToken = () => {
  const generalToken = localStorage.getItem("generalToken");
  return {generalToken};
}

export const getRefreshToken = () => {
  const refreshToken = localStorage.getItem("refreshToken");
  return {refreshToken}
}

const setGeneralToken = (generalToken: string) => {
  localStorage.setItem("generalToken", generalToken);
}

const setRefreshToken = (refreshToken: string) => {
  localStorage.setItem("refreshToken", refreshToken);
}

//로그아웃시
export const removeToken = () => {
  localStorage.removeItem("generalToken");
  localStorage.removeItem("refreshToken");
}

export const useAuthStore = create<StoreState>((set) => ({
  isLoggedIn: getGeneralToken().generalToken? true : false,
  isAutoLogin: false,
  authType: null,
  storeLogin: (generalToken) => {
    set({isLoggedIn: true});
    setGeneralToken(generalToken);
  },
  storeAutoLogin: (refreshToken) => {
    set({isAutoLogin: true});
    setRefreshToken(refreshToken);
  },
  storeAuthType: (authType) => {
    set({authType});
  },
  storeLogout: () => {
    set({isLoggedIn: false, isAutoLogin: false, authType: null});
    removeToken();
  },
}));