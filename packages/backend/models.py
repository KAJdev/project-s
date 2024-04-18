from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from bson import ObjectId

MISSING = object()


def convert_dates_to_iso(d):
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat() + "Z"
    return d


class ModelMixin:

    def to_dict(self, external: bool = True):
        d = asdict(self)

        # look through field metadata to see if it's internal
        for k, v in d.copy().items():
            if hasattr(v, "to_dict"):
                d[k] = v.to_dict(external=external)

            # if it's internal, remove it
            if (
                self.__dataclass_fields__[k].metadata.get("internal", False)
                and external
            ):
                del d[k]

        if external:
            d = convert_dates_to_iso(d)

        if d.get("_id", MISSING) is None:
            del d["_id"]

        return d


class EditableMixin:

    @classmethod
    def validate_update(cls, data):
        d = {}
        for k, v in data.items():
            if (
                k in cls.__dataclass_fields__
                and cls.__dataclass_fields__[k].metadata.get("editable", False)
                and isinstance(v, cls.__dataclass_fields__[k].type)
            ):
                d[k] = v

        return d

    def update(self, data):
        for k, v in data.items():
            if (
                k in self.__dataclass_fields__
                and self.__dataclass_fields__[k].metadata.get("editable", False)
                and isinstance(v, self.__dataclass_fields__[k].type)
            ):
                setattr(self, k, v)


@dataclass()
class User(ModelMixin, EditableMixin):
    _id: Optional[ObjectId] = field(
        default=None, metadata={"internal": True, "editable": False}
    )
    id: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    username: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    password: str = field(
        default_factory=str, metadata={"internal": True, "editable": False}
    )
    display_name: str = field(
        metadata={"internal": False, "editable": True}, default_factory=str
    )
    token: str = field(
        default_factory=str, metadata={"internal": True, "editable": False}
    )
    email: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": False}
    )
    avatar_url: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": True}
    )
    banner_url: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": True}
    )
    bio: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": True}
    )
    created_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": False, "editable": False}
    )
    updated_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": True, "editable": False}
    )
    last_login: Optional[datetime] = field(
        default=None, metadata={"internal": True, "editable": False}
    )

    def to_dict(self, external: bool = True, include_token: bool = False):
        d = super().to_dict(external=external)
        if include_token:
            d["token"] = self.token
        return d


@dataclass()
class Channel(ModelMixin, EditableMixin):
    _id: Optional[ObjectId] = field(
        default=None, metadata={"internal": True, "editable": False}
    )
    id: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    name: str = field(
        metadata={"internal": False, "editable": True}, default_factory=str
    )
    description: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": True}
    )
    owner: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    members: list[str] = field(
        default_factory=list, metadata={"internal": False, "editable": False}
    )
    icon_url: Optional[str] = field(
        default=None, metadata={"internal": False, "editable": False}
    )
    created_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": False, "editable": False}
    )
    updated_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": False, "editable": False}
    )
    public: bool = field(default=True, metadata={"internal": False, "editable": True})


@dataclass()
class Message(ModelMixin, EditableMixin):
    _id: Optional[ObjectId] = field(
        default=None, metadata={"internal": True, "editable": False}
    )
    id: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    content: str = field(
        metadata={"internal": False, "editable": True}, default_factory=str
    )
    owner: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    channel: str = field(
        metadata={"internal": False, "editable": False}, default_factory=str
    )
    created_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": False, "editable": False}
    )
    updated_at: datetime = field(
        default_factory=datetime.utcnow, metadata={"internal": False, "editable": False}
    )
    deleted_at: Optional[datetime] = field(
        default=None, metadata={"internal": True, "editable": False}
    )


class GatewayOpCode(Enum):
    INVALID = 0
    READY = 1
    PING = 2
    PONG = 3
    MESSAGE_CREATE = 4
    MESSAGE_UPDATE = 5
    MESSAGE_DELETE = 6
    CHANNEL_CREATE = 7
    CHANNEL_UPDATE = 8
    CHANNEL_DELETE = 9
    USER_JOIN = 10
    USER_LEAVE = 11
    USER_UPDATE = 12
    REQUEST_CHANNELS = 13
