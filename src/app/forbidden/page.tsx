import styles from './forbidden.module.css';

export default function ForbiddenPage() {
    
    return (
        <div className="forbidden-page">
            <div className={styles.container}>
                <div className={styles.forbiddenSign}></div>
                <h1>Access to this page is restricted.</h1>
                <p>Ensure you have sufficient permissions to access the same.</p>
            </div>
        </div>
    );
}