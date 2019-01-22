import * as assert from 'assert'
import * as XLSX from 'xlsx'
import * as XlsxPopulate from 'xlsx-populate'
import { Json } from 'types/json'

/**
 * A class to export the contents of an existing CCD definition xlsx
 * each sheet in the spreadsheet can be exported as a json file
 */
export class SpreadsheetConvert {
  workbook: XLSX.WorkBook
  sheets: any

  constructor (private filename: string) {
    this.workbook = XLSX.readFile(filename)
    assert(this.workbook, 'could not load ' + filename)
    this.sheets = Object.keys(this.workbook.Sheets)
  }

  async sheet2Json (sheetName: string): Promise<Json[]> {
    const worksheet: XLSX.WorkSheet = this.workbook.Sheets[sheetName]
    assert(worksheet, 'sheet named \'' + sheetName + '\' dose not exist in ' + this.filename)

    this._setSheetRange(worksheet, 2)
    return XLSX.utils.sheet_to_json(worksheet)
  }

  allSheets () {
    return this.sheets
  }

  _setSheetRange (worksheet: XLSX.WorkSheet, startRow: number) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] as string)
    range.s.r = startRow
    worksheet['!ref'] = XLSX.utils.encode_range(range)
  }
}

/**
 * A class to update the contents of an existing xlsx
 */
export class SpreadsheetBuilder {
  workbook: XLSX.WorkBook | undefined

  constructor (private filename: string) {
  }

  updateSheetDataJson (sheetName: string, json: Json[]) {
    if (this.workbook === undefined) {
      throw new Error('IllegalState: workbook is undefined')
    }

    const sheet: XLSX.WorkSheet = this.workbook.sheet(sheetName)
    assert(sheet, `Unexpected spreadsheet data file "${sheetName}.json"`)
    const headers = sheet.range('A3:AZ3').value()[0].filter((value: any) => !!value)
    if (json.length > 0) {
      const table = json.map((record: Json) => {
        return headers.map((key: string) => {
          const data = record[key]
          return data ? data : null
        })
      })
      sheet.cell('A4').value(table)
    }
  }

  async loadAsync () {
    this.workbook = await XlsxPopulate.fromFileAsync(this.filename)
  }

  saveAsAsync (newFilename: string) {
    if (this.workbook === undefined) {
      throw new Error('IllegalState: workbook is undefined')
    }

    return this.workbook.toFileAsync(newFilename)
  }
}
