/**
 *
 */
import { arraysAreEqual, imply } from '../helpers'
import { HeaderView } from './dataViews'
import { SectorType } from './enums'

export class Header {
  constructor(private headerView: HeaderView) {
  }

  public check(): boolean {
    return (
      arraysAreEqual(this.headerSignature, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) &&
      (this.version === '3.62' || this.version === '4.62') &&
      this.headerView.headerClsidView.every((value: number) => value === 0) &&
      (arraysAreEqual(this.bytesOrder, [0xFF, 0xFE]) || arraysAreEqual(this.bytesOrder, [0xFE, 0xFF])) &&
      imply(this.version === '3.62', this.sectorSize === 512) &&
      imply(this.version === '4.62', this.sectorSize === 4096) &&
      this.miniSectorSize === 64 &&
      this.headerView.reservedView.every((value: number) => value === 0) &&
      imply(this.version === '3.62', this.headerView.directoryChainLengthView[0] === 0) &&
      this.miniSectorCutoff === 4096 &&
      this.checkDifat() &&
      imply(this.version === '4.62', () => this.headerView.remainingSpace.every((value: number) => value === 0))
    )
  }

  private checkDifat(): boolean {
    const endOfInitialDifat = this.initialDifat.indexOf(SectorType.FREESECT)
    if (endOfInitialDifat === -1) {
      return (
        this.startOfDifat !== SectorType.ENDOFCHAIN &&
        this.initialDifat.every((value: number) => value <= SectorType.MAXREGSECT) &&
        this.initialDifat.length < this.numberOfFatSectors
      )
    }

    return (
      this.initialDifat.every((value: number) => value <= SectorType.MAXREGSECT || value === SectorType.FREESECT) &&
      this.initialDifat.slice(endOfInitialDifat).every((value: number) => value === SectorType.FREESECT) &&
      this.initialDifat.slice(0, endOfInitialDifat).length === this.numberOfFatSectors
    )
  }

  private get headerSignature(): number[] {
    return Array.from(this.headerView.headerSignatureView.values())
  }

  private get version(): string {
    return `${this.headerView.majorVersionView[0]}.${this.headerView.minorVersionView[0]}`
  }

  public get startOfMiniFat(): number {
    return this.headerView.miniFatStart[0]
  }

  public get startOfDifat(): number {
    return this.headerView.difatChainStart[0]
  }

  public get startOfDirectoryChain(): number {
    return this.headerView.directoryChainStartView[0]
  }

  public get initialDifat(): number[] {
    return Array.from(this.headerView.initialDifatChain.values())
  }

  public get miniSectorCutoff(): number {
    return this.headerView.miniSectorCutoff[0]
  }

  public get sectorSize(): number {
    // tslint:disable-next-line:no-bitwise
    return 1 << this.headerView.sectorShiftView[0]
  }

  private get numberOfFatSectors(): number {
    return this.headerView.fatChainLengthView[0]
  }

  public get miniSectorSize(): number {
    // tslint:disable-next-line:no-bitwise
    return 1 << this.headerView.miniSectorShiftView[0]
  }

  public get bytesOrder(): [number, number] {
    return [this.headerView.bytesOrderView[0], this.headerView.bytesOrderView[1]]
  }

  public resetAsV4(): void {
    this.headerView.resetAsV4()
  }

  public resetAsV3(): void {
    this.headerView.resetAsV3()
  }
}
