import StatsGrid from './StatsGrid';
import DropZone from './DropZone';
import RecentActivity from './RecentActivity';
import FormatCards from './FormatCards';
import './Dashboard.css';

export default function Dashboard() {
    return (
        <main className="dashboard">
            {/* Background glow */}
            <div className="dashboard__bg-glow" aria-hidden="true" />

            {/* Stats Row */}
            <section className="dashboard__section">
                <StatsGrid />
            </section>

            {/* Main content: Drop Zone + Recent Activity */}
            <section className="dashboard__section dashboard__main-grid">
                {/* Drop Zone / Converter */}
                <div className="dashboard__primary glass-card">
                    <DropZone />
                </div>

                {/* Recent Activity */}
                <div className="dashboard__secondary glass-card">
                    <RecentActivity />
                </div>
            </section>

            {/* Format Categories */}
            <section className="dashboard__section">
                <FormatCards />
            </section>

            {/* Quick Tips Banner */}
            <section className="dashboard__section">
                <div className="tips-banner">
                    <div className="tips-banner__content">
                        <span className="tips-banner__icon">⚡</span>
                        <div>
                            <p className="tips-banner__title">Pro Tip</p>
                            <p className="tips-banner__text">
                                You can batch-convert up to 50 files at once. Drag multiple files into the converter,
                                pick your target format, and they all convert in parallel at lightning speed.
                            </p>
                        </div>
                    </div>
                    <button id="try-batch-btn" className="tips-banner__cta">Try Batch Convert →</button>
                </div>
            </section>
        </main>
    );
}
