import { Compiler } from 'webpack';
import fs from 'fs';
import path from 'path';

interface Props {
  controllerRootPaths: string[];
  generatedControllerTypesFileName: string;
}

class SocketAPIPlugin {
  constructor(props: Props) {
    this.#props = { ...props };
  }

  #props: Props;

  apply(compiler: Compiler) {
    compiler.hooks.beforeRun.tap('SocketAPIPlugin', () => {
      const imports: string[] = [];
      const types: string[] = [];
      this.#props.controllerRootPaths.forEach(controllerRootPath => {
        const controllerFiles = this.#identifyControllerFiles(controllerRootPath);
        const controllerDetails = controllerFiles.map(file => this.#extractControllerDetails(file)).filter(v => v != null);
        controllerDetails.forEach(({ file, name, type }) => {
          imports.push(`import type { ${type} } from '${path.relative(this.#props.generatedControllerTypesFileName, file)}';`);
          types.push(`'${name}': createSocketProxy<${type}>('${name}'),`);
        });
      });
      console.log({ imports, types });
    });
  }

  #identifyControllerFiles(controllerRootPath: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(controllerRootPath, { withFileTypes: true });
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        files.push(...this.#identifyControllerFiles(entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(path.resolve(controllerRootPath, entry.name));
      }
    });
    return files;
  }

  #extractControllerDetails(controllerFilePath: string) {
    return {
      file: controllerFilePath,
      name: '',
      type: '',
    };
  }
}

export = SocketAPIPlugin;
