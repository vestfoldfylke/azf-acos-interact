const getSchoolYear = (datestring) => {
  const date = datestring ? new Date(datestring) : new Date()
  // If date is after 1. august, we assume new school year has begun
  if (date.getMonth() + 1 >= 8) {
    return `${date.getFullYear()}/${date.getFullYear() + 1}`
  }

  return `${date.getFullYear() - 1}/${date.getFullYear()}`
}

module.exports = {
  getSchoolYear
}
