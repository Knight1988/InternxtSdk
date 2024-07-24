namespace DarkKnight.InternxtSdk.Exceptions;

public class VersionNotExistException : Exception
{
    public VersionNotExistException() : base("Version does not exist")
    {
    }
    
    public VersionNotExistException(string message) : base(message)
    {
    }
}