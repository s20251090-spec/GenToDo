import React, { useState, useCallback } from 'react';
import './FloatingActionButton.css';

export interface FloatingActionButtonProps {
  onMasterPlanClick?: () => void;
  onDailyPlanClick?: () => void;
  onModifyPlanClick?: () => void;
  bottom?: string;
  right?: string;
  left?: string;
  zIndex?: number;
  primaryColor?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = (props) => {
  const {
    onMasterPlanClick,
    onDailyPlanClick,
    onModifyPlanClick,
    bottom = '20px',
    right = '20px',
    left,
    zIndex = 999,
    primaryColor = '#165DFF',
  } = props;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleMenuClick = useCallback(
    (callback?: () => void) => {
      closeDrawer();
      callback?.();
    },
    [closeDrawer]
  );

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const cssVars = {
    '--fab-primary-color': primaryColor,
    '--fab-z-index': zIndex.toString(),
    '--fab-bottom': bottom,
    '--fab-right': right,
    '--fab-left': left || 'auto',
  } as React.CSSProperties;

  return (
    <div className="fab-root" style={cssVars}>
      <div className={`fab-overlay ${isDrawerOpen ? 'fab-overlay--open' : ''}`} onClick={closeDrawer} />

      <div className={`fab-drawer ${isDrawerOpen ? 'fab-drawer--open' : ''}`} onClick={stopPropagation}>
        <div className="fab-drawer__drag-bar" />
        <h3 className="fab-drawer__title">Learning Tools</h3>

        <div className="fab-drawer__menu-list">
          <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onMasterPlanClick)}>
            <div className="fab-drawer__menu-icon">🧭</div>
            <div className="fab-drawer__menu-text">
              <h4>Make Master Study Plan</h4>
              <p>Customize your full learning roadmap</p>
            </div>
          </button>

          <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onDailyPlanClick)}>
            <div className="fab-drawer__menu-icon">📅</div>
            <div className="fab-drawer__menu-text">
              <h4>Make Daily Study Plan</h4>
              <p>Arrange your daily learning tasks</p>
            </div>
          </button>

          <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onModifyPlanClick)}>
            <div className="fab-drawer__menu-icon">✏️</div>
            <div className="fab-drawer__menu-text">
              <h4>Modify Existing Plan</h4>
              <p>Adjust your current study plan</p>
            </div>
          </button>
        </div>
      </div>

      <button className={`fab-button ${isDrawerOpen ? 'fab-button--open' : ''}`} onClick={toggleDrawer} aria-label="Open learning tools menu">
        <span className={`fab-button__icon ${isDrawerOpen ? 'fab-button__icon--rotate' : ''}`}>+</span>
      </button>
    </div>
  );
};

export default FloatingActionButton;
