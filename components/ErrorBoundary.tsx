import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    componentStack: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, componentStack: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('🔴 [ErrorBoundary] Caught error:', error.message);
        console.error('🔴 [ErrorBoundary] Stack:', error.stack);
        console.error('🔴 [ErrorBoundary] Component stack:', errorInfo.componentStack);
        this.setState({ componentStack: errorInfo.componentStack ?? null });
    }

    render() {
        if (this.state.hasError) {
            return (
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>🔴 App Crash Detected</Text>
                    <Text style={styles.label}>Error:</Text>
                    <Text style={styles.message}>{this.state.error?.message}</Text>
                    <Text style={styles.label}>Stack:</Text>
                    <Text style={styles.stack}>{this.state.error?.stack}</Text>
                    {this.state.componentStack ? (
                        <>
                            <Text style={styles.label}>Component Stack:</Text>
                            <Text style={styles.stack}>{this.state.componentStack}</Text>
                        </>
                    ) : null}
                </ScrollView>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#1a0000',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ff4444',
        marginBottom: 20,
        marginTop: 60,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffaa00',
        marginTop: 16,
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#ffffff',
        backgroundColor: '#300000',
        padding: 10,
        borderRadius: 6,
    },
    stack: {
        fontSize: 11,
        color: '#cccccc',
        backgroundColor: '#200000',
        padding: 10,
        borderRadius: 6,
        fontFamily: 'Courier',
    },
});
