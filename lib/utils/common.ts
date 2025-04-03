import { Dispatch, SetStateAction } from 'react';
import { Magic } from 'magic-sdk';

export type LoginMethod = 'EMAIL' | 'SMS' | 'SOCIAL' | 'FORM';

export const logout = async (setToken: Dispatch<SetStateAction<string>>, magic: Magic | null) => {
  if (magic && await magic.user.isLoggedIn()) {
    await magic.user.logout();
  }
  localStorage.setItem('token', '');
  localStorage.setItem('user', '');
  setToken('');
};

export const saveUserInfo = (token: string, loginMethod: LoginMethod, userAddress: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('isAuthLoading', 'false');
  localStorage.setItem('loginMethod', loginMethod);
  localStorage.setItem('user', userAddress);
};