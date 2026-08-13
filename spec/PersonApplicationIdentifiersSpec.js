/**
 * The person related AIs, 7250 to 7259, identify a patient rather than a trade
 * item, and 7250/7251 are the first date elements in the library to carry a
 * full four digit year.
 *
 * That difference is the whole point of these specs: reading YYYYMMDD with the
 * two digit date parser yields a wrong date AND leaves the surplus digits
 * behind to be parsed as another AI, so the barcode comes back with an extra
 * element instead of an error.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const fncChar = String.fromCharCode(29); // the ASCII "group separator"

describe("The date of birth", () => {
    it("is read as a four digit year", () => {
        const result = parseBarcode("]C1725019850630");
        const dateOfBirth = result.parsedCodeItems[0].data;

        expect(result.parsedCodeItems[0].ai).toBe("7250");
        expect(result.parsedCodeItems[0].dataTitle).toBe("DOB");
        expect(dateOfBirth.getFullYear()).toBe(1985);
        expect(dateOfBirth.getMonth()).toBe(5); // June, months start at 0
        expect(dateOfBirth.getDate()).toBe(30);
    });

    it("consumes all eight digits, leaving nothing to parse as another AI", () => {
        const result = parseBarcode("]C1725019850630");

        expect(result.parsedCodeItems.length).toBe(1);
    });

    it("keeps the year it was given rather than sliding it into this century", () => {
        const result = parseBarcode("]C1725019200101");

        expect(result.parsedCodeItems[0].data.getFullYear()).toBe(1920);
    });

    it("is rejected when it is too short to hold a four digit year", () => {
        expect(() => parseBarcode("]C17250850630")).toThrow("invalid year in date");
    });

    it("is rejected when the month is impossible", () => {
        expect(() => parseBarcode("]C1725019851330")).toThrow("invalid month in date");
    });

    it("is rejected when the day is impossible", () => {
        expect(() => parseBarcode("]C1725019850632")).toThrow("invalid day in date");
    });

    it("accepts the 29th of February in a leap year", () => {
        const result = parseBarcode("]C1725020240229");

        expect(result.parsedCodeItems[0].data.getMonth()).toBe(1);
        expect(result.parsedCodeItems[0].data.getDate()).toBe(29);
    });

    it("is rejected on the 29th of February in a common year", () => {
        expect(() => parseBarcode("]C1725020230229")).toThrow("invalid day in date");
    });

    it("is rejected on a day the month does not have", () => {
        expect(() => parseBarcode("]C1725020230431")).toThrow("invalid day in date");
    });

    it("still parses when another element follows it", () => {
        const result = parseBarcode(`]C1725019850630${fncChar}7253MURPHY`);

        expect(result.parsedCodeItems.length).toBe(2);
        expect(result.parsedCodeItems[1]).toEqual(jasmine.objectContaining({
            ai: "7253",
            dataTitle: "FAMILY NAME",
            data: "MURPHY"
        }));
    });
});

describe("The date and time of birth", () => {
    it("carries the hours and minutes as well", () => {
        const result = parseBarcode("]C17251198506301435");
        const born = result.parsedCodeItems[0].data;

        expect(result.parsedCodeItems[0].ai).toBe("7251");
        expect(born.getFullYear()).toBe(1985);
        expect(born.getDate()).toBe(30);
        expect(born.getHours()).toBe(14);
        expect(born.getMinutes()).toBe(35);
    });

    it("consumes all twelve digits", () => {
        const result = parseBarcode("]C17251198506301435");

        expect(result.parsedCodeItems.length).toBe(1);
    });

    it("is rejected when the hours are impossible", () => {
        expect(() => parseBarcode("]C17251198506302435")).toThrow("invalid number");
    });

    it("is rejected when the minutes are impossible", () => {
        expect(() => parseBarcode("]C17251198506301460")).toThrow("invalid number");
    });
});

describe("The remaining person elements", () => {
    it("read the biological sex as a single character", () => {
        const result = parseBarcode(`]C172521${fncChar}7254SEAN`);

        expect(result.parsedCodeItems[0]).toEqual(jasmine.objectContaining({
            ai: "7252",
            dataTitle: "BIOLOGICAL SEX",
            data: "1"
        }));
        expect(result.parsedCodeItems[1].data).toBe("SEAN");
    });

    it("read the name elements up to the separator", () => {
        const barcode = `]C17253MURPHY${fncChar}7254SEAN${fncChar}7255JR${fncChar}7256SEAN MURPHY`;
        const result = parseBarcode(barcode);

        expect(result.parsedCodeItems.map((item) => item.ai))
            .toEqual(["7253", "7254", "7255", "7256"]);
        expect(result.parsedCodeItems[3].data).toBe("SEAN MURPHY");
    });

    it("read the address, birth sequence and baby name", () => {
        const barcode = `]C17257CORK${fncChar}72581/2${fncChar}7259MURPHY`;
        const result = parseBarcode(barcode);

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "7257", dataTitle: "PERSON ADDR", data: "CORK" }),
            jasmine.objectContaining({ ai: "7258", dataTitle: "BIRTH SEQUENCE", data: "1/2" }),
            jasmine.objectContaining({ ai: "7259", dataTitle: "BABY", data: "MURPHY" })
        ]);
    });
});

describe("A made-to-order trade item", () => {
    it("is read as a GTIN of fixed length", () => {
        const result = parseBarcode("]C10304012345678901");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "03",
            dataTitle: "MTO GTIN",
            data: "04012345678901"
        })]);
    });
});

describe("The Italian national healthcare reimbursement number", () => {
    it("is read up to the separator", () => {
        const result = parseBarcode(`]C1716045678901${fncChar}10ABC123`);

        expect(result.parsedCodeItems[0]).toEqual(jasmine.objectContaining({
            ai: "716",
            dataTitle: "NHRN AIC",
            data: "045678901"
        }));
    });
});

describe("A healthcare barcode carrying both a product and a patient", () => {
    it("parses every element", () => {
        const barcode = `]d2010401234567890117261230${fncChar}10BATCH42` +
            `${fncChar}725019850630${fncChar}7253MURPHY${fncChar}7254SEAN`;
        const result = parseBarcode(barcode);

        expect(result.codeName).toBe("GS1 DataMatrix");
        expect(result.parsedCodeItems.map((item) => item.ai))
            .toEqual(["01", "17", "10", "7250", "7253", "7254"]);
    });
});

/**
 * The person elements have to work through the other two ways a code can arrive:
 * written in the human readable form, and cut short.
 */
describe("A person element written in the parenthesised form", () => {
    it("reads a date of birth", () => {
        const result = parseBarcode("(7250)19850630");
        const dateOfBirth = result.parsedCodeItems[0].data;

        expect(result.parsedCodeItems[0].ai).toBe("7250");
        expect(dateOfBirth.getFullYear()).toBe(1985);
        expect(dateOfBirth.getDate()).toBe(30);
    });

    it("reads a date and time of birth", () => {
        const result = parseBarcode("(7251)198506301435");

        expect(result.parsedCodeItems[0].ai).toBe("7251");
        expect(result.parsedCodeItems[0].data.getHours()).toBe(14);
    });

    it("reads a made-to-order GTIN", () => {
        const result = parseBarcode("(03)04012345678901");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "03",
            data: "04012345678901"
        })]);
    });

    it("reads a whole patient label alongside the product", () => {
        const result = parseBarcode("(01)04012345678901(7250)19850630(7253)MURPHY");

        expect(result.parsedCodeItems.map((item) => item.ai)).toEqual(["01", "7250", "7253"]);
        expect(result.parsedCodeItems[2].data).toBe("MURPHY");
    });
});

describe("A person element which is cut short", () => {
    it("refuses a made-to-order GTIN missing most of its digits", () => {
        expect(() => parseBarcode("]C1030401")).toThrow("truncated fixed length element");
    });

    it("refuses a biological sex with no data at all", () => {
        expect(() => parseBarcode("]C17252")).toThrow("truncated fixed length element");
    });

    it("refuses a date of birth holding only six digits", () => {
        expect(() => parseBarcode("]C17250198506")).toThrow("invalid year in date");
    });

    it("refuses a date and time of birth missing its time", () => {
        expect(() => parseBarcode("]C1725119850630")).toThrow("invalid year in date");
    });
});

describe("The edges of a birth date", () => {
    it("accepts midnight", () => {
        const result = parseBarcode("]C17251198506300000");

        expect(result.parsedCodeItems[0].data.getHours()).toBe(0);
        expect(result.parsedCodeItems[0].data.getMinutes()).toBe(0);
    });

    it("accepts the last minute of the day", () => {
        const result = parseBarcode("]C17251198506302359");

        expect(result.parsedCodeItems[0].data.getHours()).toBe(23);
        expect(result.parsedCodeItems[0].data.getMinutes()).toBe(59);
    });

    it("keeps a year far in the past as written", () => {
        const result = parseBarcode("]C1725010000101");

        expect(result.parsedCodeItems[0].data.getFullYear()).toBe(1000);
    });

    it("keeps a year far in the future as written", () => {
        const result = parseBarcode("]C1725099991231");

        expect(result.parsedCodeItems[0].data.getFullYear()).toBe(9999);
    });

    it("records the digits it read in raw", () => {
        const result = parseBarcode("]C1725019850630");

        expect(result.parsedCodeItems[0].raw).toBe("19850630");
    });
});
