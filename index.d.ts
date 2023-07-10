// Generated by dts-bundle-generator v8.0.1

export type MigrationMachineContext = {
	dbPath: string;
	debug: boolean;
	migrationDir: string;
	_dbExist: boolean;
	_latestVersion: number;
	_userVersion: number;
};
export type MigrationOptions = Pick<MigrationMachineContext, "migrationDir" | "debug" | "dbPath">;
export declare const migrate: (options: MigrationOptions) => void;

export {};
