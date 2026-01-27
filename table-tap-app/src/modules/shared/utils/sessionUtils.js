import Cookies from 'js-cookie';

export const setSessionCookie = (session) => {
  Cookies.set('session', JSON.stringify(session), { 
    expires: 7, // 7 days
    secure: true,
    sameSite: 'strict'
  });
};

export const getSessionCookie = () => {
  const sessionCookie = Cookies.get('session');
  return sessionCookie ? JSON.parse(sessionCookie) : null;
};

export const removeSessionCookie = () => {
  Cookies.remove('session');
};