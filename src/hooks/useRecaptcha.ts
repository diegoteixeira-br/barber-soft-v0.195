import { useState, useEffect, useCallback } from 'react';

const RECAPTCHA_SITE_KEY = '6Le2q2EsAAAAALT1XXCEYyPsT3gfauLb_0JgYXs7';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaReturn {
  isReady: boolean;
  executeRecaptcha: (action: string) => Promise<string | null>;
}

export function useRecaptcha(): UseRecaptchaReturn {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if script is already loaded (standard v3)
    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(() => {
        setIsReady(true);
      });
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      `script[src*="recaptcha/api.js"]`
    );
    
    if (existingScript) {
      // Script exists but not loaded yet, wait for it
      const checkReady = setInterval(() => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
            clearInterval(checkReady);
          });
        }
      }, 100);
      
      return () => clearInterval(checkReady);
    }

    // Load the reCAPTCHA v3 standard script (not Enterprise)
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
        });
      }
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on cleanup as other components might use it
    };
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!isReady || !window.grecaptcha?.execute) {
      console.error('reCAPTCHA not ready');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action,
      });
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  }, [isReady]);

  return { isReady, executeRecaptcha };
}
