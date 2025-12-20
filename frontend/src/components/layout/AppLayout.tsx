// Removed unused imports
import Sidebar from './Sidebar';
import './AppLayout.css';
import GitTerminal from '../terminal/GitTerminal';
import GitGraphViz from '../visualization/GitGraphViz';

const AppLayout = () => {
    return (
        <div className="layout-container">
            {/* Left Pane: Instructions/Sidebar */}
            <aside className="sidebar-pane">
                <Sidebar />
            </aside>

            {/* Right Pane: Split content */}
            <main className="main-pane">
                {/* Upper Right: Visualization */}
                <div className="viz-pane">
                    <GitGraphViz />
                </div>

                {/* Lower Right: Terminal */}
                <div className="terminal-pane">
                    <div className="panel-header">
                        <span className="panel-title">Terminal</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                        </div>
                    </div>
                    <GitTerminal />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
