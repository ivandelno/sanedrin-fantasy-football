import { type ReactNode } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="layout">
            <div className="top-bar">
                <Header />
                <Navigation />
            </div>
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
