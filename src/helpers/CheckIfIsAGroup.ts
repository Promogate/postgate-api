const checkIfIsGroup = (remoteJid: string) => {
  return remoteJid.includes("@g")
}

export default checkIfIsGroup;