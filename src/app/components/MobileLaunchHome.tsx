import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { authStorage } from '@features/auth/lib/authStorage';

/**
 * On mobile, every fresh open of the site starts at the home page
 * (browsers often restore the last deep link like /scan or /customers).
 */
export function MobileLaunchHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    if (!isMobile) {
      handledRef.current = true;
      return;
    }

    if (!authStorage.isAuthenticated()) return;

    handledRef.current = true;

    const path = location.pathname;
    if (path === '/' || path === '/login') return;

    navigate('/', { replace: true });
  }, [isMobile, location.pathname, navigate]);

  return null;
}
