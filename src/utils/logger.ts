import chalk from 'chalk';

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class A11yRobotLogger implements Logger {
  private readonly isDebug: boolean;

  constructor() {
    this.isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
  }

  info(message: string, ...args: any[]): void {
    console.error(chalk.blue('[A11Y-ROBOT]'), chalk.white(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.error(chalk.yellow('[A11Y-ROBOT]'), chalk.yellow(message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(chalk.red('[A11Y-ROBOT]'), chalk.red(message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.error(chalk.gray('[A11Y-ROBOT]'), chalk.gray(message), ...args);
    }
  }
}

export const logger = new A11yRobotLogger(); 