import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/Header';

export default function InteriorWashScreen() {
    return (
        <View style={styles.container}>
            <Header title="Interior Wash" />
            <View style={styles.content}>
                <Text style={styles.title}>Interior Wash Service</Text>
                <Text style={styles.description}>This is a placeholder for the Interior Wash screen.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
