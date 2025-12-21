import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
    verbose?: boolean;
}

class Logger {
    private verbose: boolean = false;

    setVerbose(verbose: boolean): void {
        this.verbose = verbose;
    }

    private getTimestamp(): string {
        return new Date().toLocaleTimeString('ko-KR', { hour12: false });
    }

    debug(...args: unknown[]): void {
        if (this.verbose) {
            console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.gray('DEBUG'), ...args);
        }
    }

    info(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.blue('ℹ'), ...args);
    }

    success(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.green('✓'), ...args);
    }

    warn(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.yellow('⚠'), ...args);
    }

    error(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.red('✗'), ...args);
    }

    deployment(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.magenta('📦'), ...args);
    }

    download(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.cyan('⬇️'), ...args);
    }

    upload(...args: unknown[]): void {
        console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.cyan('📤'), ...args);
    }

    poll(...args: unknown[]): void {
        if (this.verbose) {
            console.log(chalk.gray(`[${this.getTimestamp()}]`), chalk.gray('📡'), ...args);
        }
    }
}

export const logger = new Logger();
