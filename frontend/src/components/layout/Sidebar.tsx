import { BookOpen, List } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                <BookOpen size={20} />
                <span>Level Instructions</span>
            </div>

            <div className="level-info">
                <h2>Introduction to Git</h2>
                <p>
                    Welcome to the interactive Git playground! In this level, you will learn the basics of committing changes.
                </p>
            </div>

            <div className="goals-section">
                <div className="section-title">
                    <List size={16} />
                    <span>Goals</span>
                </div>
                <div className="goal-item">
                    <div className="goal-status pending" />
                    <span>Create two new commits</span>
                </div>
                <div className="goal-item">
                    <div className="goal-status pending" />
                    <span>Check out the main branch</span>
                </div>
            </div>

            <div style={{ flex: 1 }} />

            <div className="level-progress">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }} />
                </div>
                <span>0% Complete</span>
            </div>
        </div>
    );
};

export default Sidebar;
