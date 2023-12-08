export default function getArg(argName = '') {
  if (process.argv.length <= 2) {
    return undefined;
  }
  const allArgs = process.argv.slice(2);
  if (argName.length === 0) {
    const [arg] = allArgs.filter((value) => !value.includes('='));
    return arg;
  }

  const [arg] = allArgs.filter((value) => value.startsWith(`${argName}=`));
  return arg ? arg.replaceAll(`${argName}=`, '') : undefined;
}
