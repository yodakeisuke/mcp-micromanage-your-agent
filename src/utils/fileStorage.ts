import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// ファイルパスを解決するための定数
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データディレクトリのパス（デフォルトでは src/data に設定）
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../visualization/public/data');
const DEFAULT_FILE_NAME = 'workplan.json';

// 設定可能なオプション
let dataDir = DEFAULT_DATA_DIR;
let dataFileName = DEFAULT_FILE_NAME;

/**
 * ファイル保存先ディレクトリを設定
 * @param dir 保存先ディレクトリのパス
 */
export function setDataDirectory(dir: string): void {
  logger.info(`Setting data directory to: ${dir}`);
  dataDir = dir;
  ensureDirectoryExists(dataDir);
}

/**
 * ファイル名を設定
 * @param fileName ファイル名
 */
export function setDataFileName(fileName: string): void {
  logger.info(`Setting data file name to: ${fileName}`);
  dataFileName = fileName;
}

/**
 * データファイルの完全パスを取得
 * @returns データファイルの完全パス
 */
export function getDataFilePath(): string {
  return path.resolve(dataDir, dataFileName);
}

/**
 * ディレクトリが存在することを確認し、存在しない場合は作成
 * @param dirPath 確認するディレクトリパス
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    logger.info(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * JSONデータをファイルに保存
 * @param data 保存するJSONデータ
 * @returns 成功した場合はtrue、失敗した場合はfalse
 */
export function saveToFile<T>(data: T): boolean {
  try {
    ensureDirectoryExists(dataDir);
    const filePath = getDataFilePath();
    logger.debug(`Saving data to file: ${filePath}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    logger.info(`Data successfully saved to: ${filePath}`);
    return true;
  } catch (error) {
    logger.logError(`Failed to save data to file`, error);
    return false;
  }
}

/**
 * ファイルからJSONデータを読み込み
 * @param defaultData ファイルが存在しない場合のデフォルトデータ
 * @returns 読み込んだデータまたはデフォルトデータ
 */
export function loadFromFile<T>(defaultData: T): T {
  try {
    const filePath = getDataFilePath();
    
    if (!fs.existsSync(filePath)) {
      logger.info(`File not found: ${filePath}, using default data`);
      return defaultData;
    }
    
    logger.debug(`Loading data from file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(fileContent) as T;
    logger.info(`Data successfully loaded from: ${filePath}`);
    return parsedData;
  } catch (error) {
    logger.logError(`Failed to load data from file`, error);
    return defaultData;
  }
}

/**
 * ファイルが存在するかどうかを確認
 * @returns ファイルが存在する場合はtrue、そうでない場合はfalse
 */
export function fileExists(): boolean {
  const filePath = getDataFilePath();
  const exists = fs.existsSync(filePath);
  logger.debug(`Checking if file exists: ${filePath} - ${exists ? 'Yes' : 'No'}`);
  return exists;
}

// 初期化時にデータディレクトリの存在を確認
ensureDirectoryExists(dataDir);
logger.info(`File storage initialized with data directory: ${dataDir} and file name: ${dataFileName}`); 