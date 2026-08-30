export function formatDecimalString(value: string, scale = 2): string {
	const text = String(value ?? '').trim();
	const match = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(text);
	if (!match) return text || `0.${'0'.repeat(scale)}`;
	const sign = match[1] === '+' ? '' : match[1];
	const integer = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	if (scale === 0) return `${sign}${integer}`;
	const fraction = `${match[3] ?? ''}${'0'.repeat(scale)}`.slice(0, scale);
	return `${sign}${integer}.${fraction}`;
}

export function decimalStringToChartNumber(value: string): number | null {
	const match = /^([+-]?)(\d+)(?:\.(\d{0,2}))?$/.exec(String(value ?? '').trim());
	if (!match) return null;
	const fraction = `${match[3] ?? ''}00`.slice(0, 2);
	const cents = (BigInt(match[2]) * 100n + BigInt(fraction)) * (match[1] === '-' ? -1n : 1n);
	if (cents > BigInt(Number.MAX_SAFE_INTEGER) || cents < BigInt(Number.MIN_SAFE_INTEGER)) return null;
	return Number(cents) / 100;
}
