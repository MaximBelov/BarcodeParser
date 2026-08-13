/**
 * A date without a time of day cannot be carried unambiguously in a Javascript
 * Date. Whoever reads one has to know whether to use the local getters or the
 * UTC ones, and either choice shifts the day for somebody: read
 * `parseBarcode("]C117250630")` with toISOString() from Auckland and the answer
 * is the 29th of June.
 *
 * So date elements carry their date as text as well, which says the day the
 * barcode says, wherever the reader happens to be.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const fncChar = String.fromCharCode(29); // the ASCII "group separator"

function firstElement(barcode) {
    return parseBarcode(barcode).parsedCodeItems[0];
}

describe("The date an element was read as, in text", () => {
    it("is given for an expiry date", () => {
        expect(firstElement("]C117250630").isoDate).toBe("2025-06-30");
    });

    it("is given for every other kind of date element", () => {
        expect(firstElement("]C111250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C112250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C113250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C115250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C116250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C14326250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C17006250630").isoDate).toBe("2025-06-30");
        expect(firstElement("]C17007250630").isoDate).toBe("2025-06-30");
    });

    it("says the day a day of 00 was resolved to, not the digits as scanned", () => {
        const element = firstElement("]C117250600");

        expect(element.raw).toBe("250600");
        expect(element.isoDate).toBe("2025-06-30");
    });

    it("carries the four digit year of a date of birth", () => {
        expect(firstElement("]C1725019850630").isoDate).toBe("1985-06-30");
    });

    it("carries the time as well when the element holds one", () => {
        expect(firstElement("]C17251198506301435").isoDate).toBe("1985-06-30T14:35");
    });

    it("pads a single digit month, day, hour and minute", () => {
        expect(firstElement("]C117250101").isoDate).toBe("2025-01-01");
        expect(firstElement("]C17251198501010905").isoDate).toBe("1985-01-01T09:05");
    });

    it("is empty on an element which holds no date", () => {
        const result = parseBarcode(`]C10104012345678901${fncChar}10ABC123`);

        expect(result.parsedCodeItems[0].isoDate).toBe("");
        expect(result.parsedCodeItems[1].isoDate).toBe("");
    });

    it("is empty on a measure", () => {
        expect(firstElement("]C13103000525").isoDate).toBe("");
    });
});

describe("The date in text, read from a different timezone", () => {
    const realTimezone = process.env.TZ;

    afterEach(() => {
        if (realTimezone === undefined) {
            delete process.env.TZ;
        } else {
            process.env.TZ = realTimezone;
        }
    });

    ["UTC", "America/New_York", "Pacific/Auckland", "Asia/Kolkata"].forEach((timezone) => {
        it(`says the same day in ${timezone}`, () => {
            process.env.TZ = timezone;

            expect(firstElement("]C117250630").isoDate).toBe("2025-06-30");
        });
    });

    it("says the day the Date itself does not, east of Greenwich", () => {
        process.env.TZ = "Pacific/Auckland";

        const element = firstElement("]C117250630");

        // This is the whole point: serialising the Date loses a day here.
        expect(element.data.toISOString().slice(0, 10)).toBe("2025-06-29");
        expect(element.isoDate).toBe("2025-06-30");
    });
});
