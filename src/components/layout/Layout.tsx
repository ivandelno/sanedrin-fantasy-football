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
            <Header />
            <main className="main-content">
                {children}
            </main>
            <Navigation />
        </div>
    );
}
