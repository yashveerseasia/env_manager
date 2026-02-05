const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export const isValidIPv4 = (ip: string): boolean => {
  if (!ip) return false;
  return IPV4_REGEX.test(ip.trim());
};

export const parseIpList = (value: string): string[] => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export const validateIpList = (value: string): string | null => {
  const ips = parseIpList(value);
  for (const ip of ips) {
    if (!isValidIPv4(ip)) {
      return `Invalid IPv4 address: ${ip}`;
    }
  }
  return null;
};


