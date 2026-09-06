export interface KyrspectPlugin<T = unknown> {
  name: string;
  setup(player: T): void;
  destroy?(): void;
}
