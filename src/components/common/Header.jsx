import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationDropdown } from "./NotificationDropdown.jsx";

export default function Header({ 
    navigationLinks = [], 
    notifications = [], 
    onLogout,
    logoText = "EduLearn",
    onMarkAllNotificationsRead,
}) {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [localNotifications, setLocalNotifications] = useState(notifications);
    const notificationRef = useRef(null);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            // 기본 로그아웃 로직
            navigate('/');
        }
    };

    const handleNotificationClick = (e) => {
        e.stopPropagation();
        const willOpen = !showNotifications;
        setShowNotifications(willOpen);
        if (willOpen) {
            const unreadIds = localNotifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                if (typeof onMarkAllNotificationsRead === 'function') {
                    onMarkAllNotificationsRead(unreadIds);
                }
            }
        }
    };

    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);

    const unreadCount = localNotifications.filter(n => !n.read).length;

    return (
        <div className="header-nav">
            <div className="header-nav-left">
                <Link to="/" className="logo">{logoText}</Link>
                {navigationLinks.map((link, index) => (
                    <Link 
                        key={index}
                        to={link.to} 
                        className="nav-link"
                    >
                        {link.text}
                    </Link>
                ))}
            </div>
            <div className="header-nav-right">
                <div ref={notificationRef} style={{ position: 'relative' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleNotificationClick} 
                        style={{ padding: '8px 12px', position: 'relative' }}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'var(--warn)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    
                    {showNotifications && (
                        <NotificationDropdown 
                            notifications={localNotifications}
                            onClose={() => setShowNotifications(false)}
                        />
                    )}
                </div>
                <button className="btn btn-outline" onClick={handleLogout}>로그아웃</button>
            </div>
        </div>
    );
}
