import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import { useBasePathNavigate } from './BasePathContext';
import AuthWrapper from './AuthWrapper';

const LOADING_TIMEOUT_MS = 8000;

/**
 * OwnerOnlyWrapper
 * - Ensures user is authenticated + profile is complete (via AuthWrapper)
 * - Then enforces profiles.profile_role === 'owner' or 'admin'
 */
export default function OwnerOnlyWrapper({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [checkingRole, setCheckingRole] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const navigate = useBasePathNavigate();
    const location = useLocation();
    const checkInProgressRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        let mounted = true;
        let timeoutId;

        const finishChecking = (owner, redirect) => {
            if (!mounted) return;
            setCheckingRole(false);
            setIsOwner(owner);
            setShouldRedirect(redirect);
            checkInProgressRef.current = false;
        };

        const checkRole = async () => {
            if (authLoading) return;

            if (!user?.id) {
                finishChecking(false, true);
                return;
            }

            // Quick check metadata
            const metadataRole = user.user_metadata?.profile_role ||
                user.app_metadata?.profile_role ||
                user.app_metadata?.role ||
                user.user_metadata?.role;

            if (metadataRole && (metadataRole.toLowerCase() === 'owner' || metadataRole.toLowerCase() === 'admin')) {
                finishChecking(true, false);
                return;
            }

            if (checkInProgressRef.current) return;
            checkInProgressRef.current = true;

            timeoutId = setTimeout(() => {
                if (!mounted) return;
                finishChecking(false, true);
            }, LOADING_TIMEOUT_MS);

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('profile_role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!mounted) return;

                if (error) {
                    finishChecking(false, true);
                } else {
                    const isAllowedRole = data?.profile_role === 'owner' || data?.profile_role === 'admin';
                    finishChecking(isAllowedRole, !isAllowedRole);
                }
            } catch (err) {
                finishChecking(false, true);
            } finally {
                if (mounted) clearTimeout(timeoutId);
            }
        };

        checkRole();

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            checkInProgressRef.current = false;
        };
    }, [authLoading, user?.id]);

    useEffect(() => {
        if (!checkingRole && !authLoading && shouldRedirect && !isOwner && mountedRef.current) {
            navigate('/login', {
                replace: true,
                state: { from: location.pathname }
            });
        }
    }, [checkingRole, authLoading, shouldRedirect, isOwner, navigate, location.pathname]);

    if (checkingRole) {
        return (
            <AuthWrapper>
                <div className="flex items-center justify-center min-h-screen bg-black">
                    <div className="text-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Checking owner permissions...</p>
                    </div>
                </div>
            </AuthWrapper>
        );
    }

    if (shouldRedirect && !isOwner) {
        return (
            <AuthWrapper>
                <div className="flex items-center justify-center min-h-screen bg-black">
                    <div className="text-center p-8">
                        <p className="text-gray-400">Redirecting...</p>
                    </div>
                </div>
            </AuthWrapper>
        );
    }

    return <AuthWrapper>{children}</AuthWrapper>;
}
