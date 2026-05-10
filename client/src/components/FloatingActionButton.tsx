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
  showDailyPlan?: boolean;
  showModifyPlan?: boolean;
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
    showDailyPlan = true,
    showModifyPlan = true,
  } = props;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0]?.clientY ?? null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0]?.clientY ?? touchStartY;
    if (currentY - touchStartY > 60) {
      closeDrawer();
      setTouchStartY(null);
    }
  }, [touchStartY, closeDrawer]);

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

      <div
        className={`fab-drawer ${isDrawerOpen ? 'fab-drawer--open' : ''}`}
        onClick={stopPropagation}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="fab-drawer__drag-bar" />
        <h3 className="fab-drawer__title">学习工具</h3>

        <div className="fab-drawer__menu-list">
          <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onMasterPlanClick)}>
            <div className="fab-drawer__menu-icon">🧭</div>
            <div className="fab-drawer__menu-text">
              <h4>制作总学习计划表</h4>
              <p>自定义你的完整学习路线图</p>
            </div>
          </button>

          {showDailyPlan && (
            <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onDailyPlanClick)}>
              <div className="fab-drawer__menu-icon">📅</div>
              <div className="fab-drawer__menu-text">
                <h4>制作每日学习计划表</h4>
                <p>安排你的每日学习任务</p>
              </div>
            </button>
          )}

          {showModifyPlan && (
            <button className="fab-drawer__menu-item" onClick={() => handleMenuClick(onModifyPlanClick)}>
              <div className="fab-drawer__menu-icon">✏️</div>
              <div className="fab-drawer__menu-text">
                <h4>修改已添加的计划</h4>
                <p>调整你当前的学习计划</p>
              </div>
            </button>
          )}
        </div>
      </div>

      <button className={`fab-button ${isDrawerOpen ? 'fab-button--open' : ''}`} onClick={toggleDrawer} aria-label="Open learning tools menu">
        <span className={`fab-button__icon ${isDrawerOpen ? 'fab-button__icon--rotate' : ''}`}>+</span>
      </button>
    </div>
  );
};

export default FloatingActionButton;
